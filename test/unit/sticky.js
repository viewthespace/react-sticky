import { expect } from 'chai';
import { jsdom } from 'jsdom';
import React from 'react';
import ReactDOM from 'react-dom';
import { mount, unmount } from '../utils';

// Initialize jsdom
global.document = jsdom('<body></body>');
global.window = document.defaultView;

const { Sticky, StickyContainer } = require('../../src');

const mountWithDefaults = (element, container) => {
  const sticky = mount(element, container);

  // Mock out some commonly called functions (override them again later as needed)
  sticky.context.offset = 0;
  sticky.context.rect = {};
  sticky.context.container = { updateOffset: () => {} }

  return sticky
};

describe('Sticky component', function() {

  beforeEach(() => {
    this.root = mount(<div></div>);
    this.rootNode = ReactDOM.findDOMNode(this.root);

    mount(<h1>SOME TEST TO ADD HEIGHT</h1>, this.rootNode)

    this.rootContainer = mount(<div></div>, this.rootNode);
    this.rootContainerNode = ReactDOM.findDOMNode(this.rootContainer);

    this.stickyContainer = mount(<StickyContainer></StickyContainer>, this.rootContainerNode);
    this.container = ReactDOM.findDOMNode(this.stickyContainer);
  });

  afterEach(() => {
    unmount(this.root);
    window.pageYOffset = 0;
    this.rootContainerNode.scrollTop = 0;
  });

  describe('state', () => {
    describe('topOffset and bottomOffset', () => {
      describe('using window', () => {
        it ('should be sticky when scroll position is greater than original position plus topOffset', () => {
          let scrollPosition = 100;
          let topOffset = 50;
          let origin = 10;

          this.sticky = mountWithDefaults(<Sticky topOffset={topOffset}>Test</Sticky>, this.container);

          // is 100 + 0 - 50 >= 10? Yes, so should be sticky
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.true;
        });

        it ('should be sticky when scroll position is equal to original position plus topOffset', () => {
          let scrollPosition = 100;
          let origin = 100;

          this.sticky = mountWithDefaults(<Sticky>Test</Sticky>, this.container);

          // is 100 > (100 - 0)? Yes, so should be sticky
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.true;
        });

        it ('should not be sticky when scroll position is less that original position plus topOffset', () => {
          let scrollPosition = 0;
          let origin = 100;

          this.sticky = mountWithDefaults(<Sticky>Test</Sticky>, this.container);

          // is 0 + 0 - 0 > 100? No, so should not sticky
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.false;
        });

        it ('should not be sticky when container height minus bottom offset is less than offset', () => {
          let scrollPosition = 101;
          let bottomOffset = 999;
          let origin = 100;
          let containerHeight = 1000;

          this.sticky = mount(<Sticky bottomOffset={bottomOffset}>Test</Sticky>, this.container);
          this.sticky.context.offset = 10;
          this.sticky.context.rect = { bottom: containerHeight };

          // 101 + 10 - 0 >= 100 AND 10 <= 1000 - 999
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.false;
        });
      });

      describe('using custom viewport', () => {
        it ('should be sticky when scroll position is greater than original position plus topOffset', () => {
          let scrollPosition = 100;
          let topOffset = 50;
          let origin = 10;

          this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode} topOffset={topOffset}>Test</Sticky>, this.container);

          // is 100 + 0 - 50 >= 10? Yes, so should be sticky
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.true;
        });

        it ('should be sticky when scroll position is equal to original position plus topOffset', () => {
          let scrollPosition = 100;
          let origin = 100;

          this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode}>Test</Sticky>, this.container);

          // is 100 > (100 - 0)? Yes, so should be sticky
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.true;
        });

        it ('should not be sticky when scroll position is less that original position plus topOffset', () => {
          let scrollPosition = 0;
          let origin = 100;

          this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode}>Test</Sticky>, this.container);

          // is 0 + 0 - 0 > 100? No, so should not sticky
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.false;
        });

        it ('should not be sticky when container height minus bottom offset is less than offset', () => {
          let scrollPosition = 101;
          let bottomOffset = 999;
          let origin = 100;
          let containerHeight = 1000;

          this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode} bottomOffset={bottomOffset}>Test</Sticky>, this.container);
          this.sticky.context.offset = 10;
          this.sticky.context.rect = { bottom: containerHeight };

          // 101 + 10 - 0 >= 100 AND 10 <= 1000 - 999
          expect(this.sticky.isSticky(scrollPosition, origin)).to.be.false;
        });
      });
    });

    describe('change events', () => {
      it ('should fire the onStickyStateChange event when sticky state changes', (done) => {
        let shouldBeSticky = true;


        function onStickyStateChange(isSticky) {
          expect(isSticky).to.equal(shouldBeSticky);
          done();
        }

        this.sticky = mountWithDefaults(
          <Sticky onStickyStateChange={onStickyStateChange}>Test</Sticky>, this.container);

        this.sticky.state.isSticky = !shouldBeSticky;
        this.sticky.onScroll();
      });

      it ('should not fire the onStickyStateChange event when sticky state remains the same', (done) => {
        let shouldBeSticky = true;

        function onStickyStateChange(isSticky) {
          expect(false).to.be.true;
        }

        this.sticky = mountWithDefaults(<Sticky onStickyStateChange={onStickyStateChange}>Test</Sticky>, this.container);

        this.sticky.state.isSticky = shouldBeSticky;
        this.sticky.onScroll();
        setTimeout(done, 20);
      });

    });
  });

  describe('className', () => {
    it ('should render the correct className depending on sticky state', () => {
      this.sticky = mountWithDefaults(<Sticky className="handle">Test</Sticky>, this.container);

      this.sticky.setState({ isSticky: false });
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.sticky.handle')).to.be.null;

      this.sticky.setState({ isSticky:  true });
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.sticky.handle')).to.not.be.null;
    });

    it ('should allow overriding sticky class name', () => {
      this.sticky = mountWithDefaults(<Sticky className="handle" stickyClassName="stuck">Test</Sticky>, this.container);

      this.sticky.setState({ isSticky:  true });
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.stuck.handle')).to.not.be.null;
    });
  });

  describe('viewport', () => {
    it ('should use the window when no container provided', () => {
      this.sticky = mountWithDefaults(<Sticky>Test</Sticky>, this.container);
      expect(this.sticky.viewport).to.equal(window);
    });

    it ('should use the offset from the window when no container provided', () => {
      this.sticky = mountWithDefaults(<Sticky>Test</Sticky>, this.container);
      window.pageYOffset = 100;
      expect(this.sticky.getScrollTop()).to.equal(100);
    });

    it ('if a container is passed in it should use it instead of the window', () => {
      this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode}>Test</Sticky>, this.container);
      expect(this.sticky.viewport).to.equal(this.rootContainerNode);
    });

    it ('should use the offset from the container when provided', () => {
      this.rootContainerNode.scrollTop = 100;
      this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode}>Test</Sticky>, this.container);
      expect(this.sticky.getScrollTop()).to.equal(100);
    });
  });

  describe('style', () => {
    it ('should render the correct style depending on sticky state', () => {
      this.sticky = mountWithDefaults(<Sticky className="handle" style={{height: 100, opacity: 0.5}} stickyStyle={{height: 200}}>Test</Sticky>, this.container);

      this.sticky.setState({ isSticky: false });
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.height).to.equal('100px');
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.opacity).to.equal('0.5');

      this.sticky.setState({ isSticky:  true });
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.height).to.equal('200px');
      expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.opacity).to.equal('0.5');
    });
  });


  describe('compensation and offsets', () => {
    describe('using window', () => {
      it ('should correctly pad the placeholder element depending on sticky state', () => {
        this.sticky = mountWithDefaults(<Sticky className="handle">Test</Sticky>, this.container);

        expect(ReactDOM.findDOMNode(this.sticky).querySelector('div:first-child').style.paddingBottom).to.equal('0px');

        this.sticky.setState({ isSticky: true, height: 100 });
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('div:first-child').style.paddingBottom).to.equal('100px');
      });

      it ('should report its height to its container', () => {
        let contextOffset = 0;
        this.sticky = mountWithDefaults(<Sticky>Test</Sticky>, this.container);
        this.sticky.context.container = { updateOffset: (offset) => { contextOffset = offset; } }
        this.sticky.setState({ origin: 100, height: 100 });

        // Sticky
        window.pageYOffset = 100;
        this.sticky.onScroll();
        expect(contextOffset).to.equal(100);

        // Not Sticky
        window.pageYOffset = 10;
        this.sticky.onScroll();
        expect(contextOffset).to.equal(0);
      });

      it ('should attempt to use the top from the context container', () => {
        this.sticky = mountWithDefaults(<Sticky className="handle" style={{top: 1}}>Test</Sticky>, this.container);
        this.sticky.context.offset = 100;
        this.sticky.context.rect = { bottom: 1000 };

        this.sticky.setState({ isSticky:  false });
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('1px');

        this.sticky.setState({ isSticky:  true });
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('100px');
      });

      it ('should stop scrolling if at the bottom of the context container', () => {
        this.sticky = mountWithDefaults(<Sticky className="handle" style={{top: 1}}>Test</Sticky>, this.container);
        this.sticky.setState({ origin: 0, height: 100 });

        this.sticky.context.rect = { bottom: 100 };
        this.sticky.onScroll();
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('0px');

        this.sticky.context.rect = { bottom: 90 };
        this.sticky.onScroll();
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('-10px');

        this.sticky.context.rect = { bottom: 0 };
        this.sticky.onScroll();
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('-100px');
      });
    });

    describe('using custom viewport', () => {
      it ('should correctly pad the placeholder element depending on sticky state', () => {
        this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode} className="handle">Test</Sticky>, this.container);

        expect(ReactDOM.findDOMNode(this.sticky).querySelector('div:first-child').style.paddingBottom).to.equal('0px');

        this.sticky.setState({ isSticky: true, height: 100 });
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('div:first-child').style.paddingBottom).to.equal('100px');
      });

      it ('should report its height to its container', () => {
        let contextOffset = 0;
        this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode}>Test</Sticky>, this.container);
        this.sticky.context.container = { updateOffset: (offset) => { contextOffset = offset; } }
        this.sticky.setState({ origin: 100, height: 100 });

        // Sticky
        this.rootContainerNode.scrollTop = 100;
        this.sticky.onScroll();
        expect(contextOffset).to.equal(100);

        // Not Sticky
        this.rootContainerNode.scrollTop = 10;
        this.sticky.onScroll();
        expect(contextOffset).to.equal(0);
      });

      it ('should attempt to use the top from the context container', () => {
        this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode} className="handle" style={{top: 1}}>Test</Sticky>, this.container);
        this.sticky.context.offset = 100;
        this.sticky.context.rect = { bottom: 1000 };

        this.sticky.setState({ isSticky:  false });
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('1px');

        this.sticky.setState({ isSticky:  true });
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('100px');
      });

      it ('should stop scrolling if at the bottom of the context container', () => {
        this.sticky = mountWithDefaults(<Sticky viewport={this.rootContainerNode} className="handle" style={{top: 1}}>Test</Sticky>, this.container);
        this.sticky.setState({ origin: 0, height: 100 });

        this.sticky.context.rect = { bottom: 100 };
        this.sticky.onScroll();
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('0px');

        this.sticky.context.rect = { bottom: 90 };
        this.sticky.onScroll();
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('-10px');

        this.sticky.context.rect = { bottom: 0 };
        this.sticky.onScroll();
        expect(ReactDOM.findDOMNode(this.sticky).querySelector('.handle').style.top).to.equal('-100px');
      });
    });
  });

  describe('isActive', () => {
    it ('should not be sticky when isActive prop is set to false', () => {
      let scrollPosition = 100;
      let topOffset = 50;
      let origin = 10;

      this.sticky = mountWithDefaults(<Sticky isActive={false} topOffset={topOffset}>Test</Sticky>, this.container);

      expect(this.sticky.isSticky(scrollPosition, origin)).to.be.false;
    });
  });
});
