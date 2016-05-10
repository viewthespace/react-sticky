import React from 'react';
import ReactDOM from 'react-dom';

export default class Sticky extends React.Component {

  static contextTypes = {
    container: React.PropTypes.any,
    offset: React.PropTypes.number,
    rect: React.PropTypes.object
  };

  static propTypes = {
    isActive: React.PropTypes.bool
  };

  static defaultProps = {
    isActive: true,
    viewport: null, // null because window might not be ready yet
    className: '',
    style: {},
    stickyClassName: 'sticky',
    stickyStyle: {},
    topOffset: 0,
    bottomOffset: 0,
    onStickyStateChange: function () {}
  };

  constructor(props, context) {
    super(props, context);
    this.viewport = this.props.viewport || window;
    this.state = {
      isSticky: false
    };
  }

  componentDidMount() {
    this.update();
    this.startListening();
  }

  componentWillReceiveProps(nextProps) {
    this.update();
    if (this.viewport !== nextProps.viewport) {
      this.stopListening();
      this.viewport = nextProps.viewport || window;
    }
  }

  componentDidUpdate(previousProps) {
    if (this.viewport !== previousProps.viewport) {
      this.startListening();
    }
  }

  componentWillUnmount() {
    this.stopListening();
  }

  getOrigin(pageY) {
    return this.refs.placeholder.getBoundingClientRect().top + pageY;
  }

  getScrollTop() {
    if (this.viewport == window) return window.pageYOffset;
    if (this.viewport.scrollTop) return this.viewport.scrollTop;
    return 0;
  }

  startListening() {
    this.on(['scroll', 'touchstart', 'touchmove', 'touchend', 'pageshow', 'load'], this.onScroll);
    this.on(['resize', 'pageshow', 'load'], this.onResize);
  }

  stopListening() {
    this.off(['scroll', 'touchstart', 'touchmove', 'touchend', 'pageshow', 'load'], this.onScroll);
    this.off(['resize', 'pageshow', 'load'], this.onResize);
  }

  update() {
    const height = ReactDOM.findDOMNode(this).getBoundingClientRect().height;
    const pageY = this.getScrollTop();
    const origin = this.getOrigin(pageY);
    const isSticky = this.isSticky(pageY, origin);
    this.setState({ height, origin, isSticky });
  }

  isSticky(pageY, origin) {
    return this.props.isActive && pageY + this.context.offset - this.props.topOffset >= origin
      && this.context.offset <= (this.context.rect.bottom || 0) - this.props.bottomOffset;
  }

  onScroll = () => {
    const pageY = this.getScrollTop();
    const origin = this.getOrigin(pageY);
    const isSticky = this.isSticky(pageY, this.state.origin);
    const hasChanged = this.state.isSticky !== isSticky;

    this.setState({ isSticky, origin });
    this.context.container.updateOffset(isSticky ? this.state.height : 0);

    if (hasChanged) this.props.onStickyStateChange(isSticky);
  }

  onResize = () => {
    const height = ReactDOM.findDOMNode(this).getBoundingClientRect().height;
    const origin = this.getOrigin(this.getScrollTop());
    this.setState({ height, origin });
  }

  on(events, callback) {
    events.forEach((evt) => {
      this.viewport.addEventListener(evt, callback);
    });
  }

  off(events, callback) {
    events.forEach((evt) => {
      this.viewport.removeEventListener(evt, callback);
    });
  }

  /*
   * The special sauce.
   */
  render() {
    const isSticky = this.state.isSticky;

    let className = this.props.className;
    if (isSticky) className += ` ${this.props.stickyClassName}`;

    let style = this.props.style;
    if (isSticky) {
      const placeholderRect = this.refs.placeholder.getBoundingClientRect();
      const stickyStyle = {
        position: 'fixed',
        top: this.context.offset,
        left: placeholderRect.left,
        width: placeholderRect.width
      };

      const bottomLimit = (this.context.rect.bottom || 0) - this.state.height - this.props.bottomOffset;
      if (this.context.offset > bottomLimit) {
        stickyStyle.top = bottomLimit;
      }

      style = Object.assign({}, this.props.style, stickyStyle, this.props.stickyStyle);
    }

    return (
      <div>
        <div ref="placeholder" style={{ paddingBottom: isSticky ? this.state.height : 0 }}></div>
        <div {...this.props} className={className} style={style}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
