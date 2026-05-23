
// ================================================================================== //

	// # Document on Ready
	// # Document on Resize
	// # Document on Scroll
	// # Document on Load

	// # Sticky Header
	// # Leader Post Size
	// # Header
	// # Post Sticky Items
	// # Sticky Sidebar Widget
	// # Sticky Sidebar
	// # Feature Section
	// # Feature Parallax
	// # Page Title
	// # Page Settings
	// # Basic Elements
	// # Isotope
	// # Parallax Section
	// # Section Settings
	// # Social Bar For Post
	// # Scroll Direction
	// # Global Variables
	// # Scrollbar Width
	// # Full Page

	// # Sticky Section

// ================================================================================== //


var GRVE = GRVE || {};
var debugJs = false;
var spinner = '<div class="grve-spinner"></div>';
var addFeatureSpinner =  false;
var hiddenMenuItemsAnimation = true;
var hiddenaAreaMinWidth = 550;
var gridEqual = true;
var deviceAnimAppear =  false;
if( 1 == movedo_grve_main_data.device_animations ) {
	deviceAnimAppear =  true;
}

(function($){

	"use strict";


	// # Document on Ready
	// ============================================================================= //
	GRVE.documentReady = {
		init: function(){
			GRVE.pageSettings.removeVideoBg();
			GRVE.pageSettings.addVideoBg();
			GRVE.sectionSettings.init();
			GRVE.slideToggleMenu.init( '#grve-hidden-menu', '#grve-hidden-menu .grve-menu' );
			GRVE.slideToggleMenu.init( '#grve-responsive-anchor', '#grve-responsive-anchor .grve-menu' );
			GRVE.slideToggleMenu.init( '#grve-main-header.grve-header-side', '#grve-main-menu.grve-vertical-menu .grve-menu' );
			GRVE.slideToggleMenu.init( '#grve-sidearea', '.widget_nav_menu' );
			if( $('.grve-page-title').length > 0 ){
				GRVE.featureSection.init( '.grve-page-title' );
				GRVE.featureSize.init( '.grve-page-title' );
			}
			GRVE.pageSettings.init();
			GRVE.isotope.init();
			GRVE.isotope.noIsoFilters();
			GRVE.basicElements.init();
		}
	};

	GRVE.reCall = {
		init: function(){
			GRVE.sectionSettings.init();
			GRVE.isotope.init();
		}
	};


	// # Document on Resize
	// ============================================================================= //
		GRVE.documentResize = {
		init: function(){
			if( $('.grve-page-title').length > 0 ){
				GRVE.featureSize.init( '.grve-page-title' );
			}
			GRVE.sectionSettings.init();
			GRVE.pageSettings.resizeVideoBg();
		}
	};

	// # Document on Scroll
	// ============================================================================= //
	GRVE.documentScroll = {
		init: function(){
			GRVE.pageSettings.onePageMenu();
		}
	};

	// # Document on Load
	// ============================================================================= //
	GRVE.documentLoad = {
		init: function(){
			GRVE.stickyHeaderTypes.init();
			GRVE.anchorSticky.init();
			GRVE.basicElements.iconBox();
			if ( $('#grve-body').hasClass( 'compose-mode' ) ) {
				GRVE.isotope.init();
			}
			// Location Hash
			if (window.location.hash) {
				setTimeout(function() {
					var target = window.location.hash;

					if( $(target).length ){
						if ( $(target).hasClass('grve-tab-content') || $(target).hasClass('grve-accordion-content')  ) {
							var tabLink =  $('.grve-tab-link[data-rel="' + target + '"]:visible');
							if ( tabLink.length ) {
								tabLink.click();
								setTimeout(function() {
									GRVE.pageSettings.linkGoToTop( tabLink );
								}, 500);
							}
						} else {
							$('html, body').scrollTop( $(target).offset().top );
						}
					}
				}, 0);
			}
		}
	};
	// # Sticky Header
	// ============================================================================= //
	GRVE.stickyHeaderTypes = {
		init : function(){
			var $header = $('#grve-header'),
				$stickyHeader = $header.find('#grve-main-header'),
				stickyHeader = $stickyHeader.hasClass('grve-header-logo-top') ? '#grve-bottom-header' : '#grve-main-header',
				stickyType = $header.data('sticky'),
				stickyDevice = $header.data('devices-sticky'),
				responsiveThreshold = parseInt(movedo_grve_main_data.responsive_thershold) - 1;

			if( stickyType === 'simple' ) {
				GRVE.stickyHeader.init({
					header: '#grve-header',
					stickyHeader : '#grve-main-header',
					headerOfsset : false,
					scrollDirection : false,
					responsive : [responsiveThreshold,6000]
				});
			}

			if( stickyType === 'shrink') {
				GRVE.stickyHeader.init({
					header: '#grve-header',
					stickyHeader : '#grve-main-header',
					headerOfsset : false,
					scrollDirection : false,
					responsive : [responsiveThreshold,6000]
				});
			}

			if( stickyType === 'advanced') {
				GRVE.stickyHeader.init({
					header: '#grve-header',
					stickyHeader : '#grve-main-header',
					headerOfsset : true,
					stickyTopHeader : true,
					scrollDirection : true,
					responsive : [responsiveThreshold,6000]
				});
			}

			if( stickyType === 'movedo') {
				GRVE.stickyHeader.init({
					header : '#grve-header',
					stickyHeader : '#grve-movedo-sticky-header',
					headerOfsset : true,
					stickyTopHeader : false,
					scrollDirection : true,
					responsive : [responsiveThreshold,6000]
				});
			}

			if( stickyDevice === 'yes' ) {
				GRVE.stickyHeader.init({
					header : '#grve-responsive-header',
					stickyHeader : '#grve-main-responsive-header',
					headerOfsset : false,
					stickyTopHeader : false,
					scrollDirection : false,
					responsive: [0,responsiveThreshold + 1]
				});
			}
		}
	};

	// # Simple Sticky Header
	// ============================================================================= //
	var goToTop = false;
	GRVE.stickyHeader = {
		config : {
			header: '#grve-header',
			stickyHeader : '#grve-main-header',
			stickyTopBar : '#grve-top-bar.grve-sticky-topbar .grve-wrapper',
			headerOfsset : false,
			stickyTopHeader : false,
			scrollDirection : false,
			responsive : [1023,6000]
		},
		init : function(settings){

			$.extend(this.config, settings);

			var $header = $(this.config.header),
				$headerSticky = $(this.config.stickyHeader),
				$topBarSticky = $(this.config.stickyTopBar),
				headerOfsset = this.config.headerOfsset,
				stickyTopHeader = this.config.stickyTopHeader,
				scrollDir = this.config.scrollDirection,
				minWidth = this.config.responsive[0],
				maxWidth = this.config.responsive[1],
				lastScroll = 0,
				tolerance = { up : 0, down : 0 },
				frameSize = 0,
				delay, headerH, topbarH, windowW, headerT, offset, topPosition, wpBarHeight;

			if( !$header ) return;
			setup();

			if( !isMobile.any() ) {
				$(window).on('resize', resizer);
			} else {
				tolerance = { up : 6, down : 5 };
				$(window).on('orientationchange', resizer);
			}

			function setup(){
				resetParams();
				updateParams();
				if (windowW + scrollBarWidth > minWidth &&  windowW + scrollBarWidth < maxWidth) {
					update();
					$(window).on('scroll.stickyHeader', update);
				} else {
					$(window).off('scroll.stickyHeader', update);
				}
			}
			function resetParams(){
				removeFixedHeader();
			}
			function updateParams(){
				wpBarHeight = $('body').hasClass('admin-bar') && $(window).width() > 783 ? 32 : 0;
				wpBarHeight = $('body').hasClass('admin-bar') && $(window).width() > 600  && $(window).width() < 783 ? 46 : wpBarHeight;
				headerH = $header.outerHeight();
				windowW = $(window).width();
				frameSize = $('body').hasClass('grve-framed') && windowW + scrollBarWidth > tabletPortrait ? $('#grve-frames').data('frame-size') : 0;
				headerT = getOffset( $header );
				topbarH = $('#grve-top-bar').length && ( $('#grve-top-bar').hasClass('grve-sticky-topbar') || $('#grve-top-bar').hasClass('grve-device-sticky-topbar') ) ? $('#grve-top-bar').outerHeight() : 0;
				offset  = !headerOfsset ? headerT - topbarH : headerT + headerH;
				offset  = Math.round(offset);
				topPosition = !stickyTopHeader ? topbarH : -(headerH - topbarH);
			}
			function resizer(){
				window.clearTimeout(delay);
				delay = window.setTimeout(function() {
					setup();
				}, 200);
			}
			function getOffset(el){
				return el.offset().top - frameSize - wpBarHeight;
			}
			function removeFixedTopBar(){
				$('#grve-top-bar').removeClass('grve-fixed');
				$header.css({ 'top' : '' });
				$topBarSticky.css({ 'top' : '' });
			}
			function addFixedTopBar(){
				$('#grve-top-bar').css({'height' : topbarH }).addClass('grve-fixed');
				$topBarSticky.css({ 'top' : frameSize + wpBarHeight });
			}
			function removeFixedHeader(){
				$header.removeClass('grve-fixed').css({ 'top' : '' });
				$headerSticky.css({ 'top' : '' });
				$('#grve-top-bar').removeClass('grve-fixed').css({ 'height' : '' });
			}
			function addFixedHeader(){
				$header.addClass('grve-fixed');
				$headerSticky.css({ 'top' : topPosition + frameSize + wpBarHeight });
			}
			function addSticky(){
				$header.addClass('grve-sticky-header grve-sticky-animate');
			}
			function removeSticky(){
				$header.removeClass('grve-sticky-header grve-scroll-up');
			}
			function addScrollUp(){
				$header.addClass('grve-scroll-up').removeClass('grve-scroll-down');
			}
			function addScrollDown(){
				$header.addClass('grve-scroll-down').removeClass('grve-scroll-up');
			}
			function toleranceExceeded(scroll, direction) {
			  return Math.abs(scroll - lastScroll) >= tolerance[direction];
			}
			function shouldUnpin(scroll, toleranceExceed, sticky){
				var scrollingDown = scroll > lastScroll;
				return scrollingDown && toleranceExceed && sticky;
			}
			function shouldPin(scroll, toleranceExceed, sticky){
				  var scrollingUp  = scroll < lastScroll;
				return scrollingUp && toleranceExceed && sticky;
			}

			function update(){
				var scroll = $(window).scrollTop(),
					scrollDirection = scroll > lastScroll ? 'down' : 'up',
					toleranceExceed = toleranceExceeded(scroll, scrollDirection),
					sticky = false;

				if( scroll < 0 || goToTop ){
					return;
				}

				if (scroll >= offset) {
					addFixedHeader();
				} else {
					removeFixedHeader();
				}

				if (scroll >= 0 ) {
					addFixedTopBar();
				} else {
					removeFixedTopBar();
				}

				if (scroll > offset) {
					addSticky();
					sticky = true;
				} else {
					removeSticky();
					sticky = false;
				}

				if(shouldUnpin(scroll, toleranceExceed, sticky) && scrollDir) {
					addScrollDown();
				}
				else if(shouldPin(scroll, toleranceExceed, sticky) && scrollDir) {
					addScrollUp();
				}

				lastScroll = scroll;
			}

		}
	};

	// # Anchor Sticky
	// ============================================================================= //
	GRVE.anchorSticky = {
		init : function(){
			var $anchor = $('.grve-anchor-menu'),
				delay;
			if( $anchor.length ){

				this.checkDevice();
				this.update();

				$(window).on('scroll', GRVE.anchorSticky.update);
				if( !isMobile.any() ) {
					$(window).on("resize",resizer);
				} else {
					$(window).on("orientationchange",resizer);
				}
			}

			function resizer(){
				window.clearTimeout(delay);
				delay = window.setTimeout(function() {
					GRVE.anchorSticky.checkDevice();
				}, 300);
			}
		},
		checkDevice : function(){
			GRVE.anchorSticky.device = false;
			var $anchor = $('.grve-anchor-menu');
			if ( $anchor.hasClass('grve-anchor-responsive-layout') ) {	
				if( $(window).width() + scrollBarWidth < tabletPortrait ) {
					GRVE.anchorSticky.device = true;
					$anchor.addClass('grve-anchor-responsive');
				} else {
					$anchor.removeClass('grve-anchor-responsive');
				}
			}

			GRVE.anchorSticky.resetAnchor();
			GRVE.anchorSticky.updateParams();
		},
		resetAnchor : function(){
			var $anchor = $('.grve-anchor-menu'),
				$anchorWrapper = $anchor.find('.grve-anchor-wrapper');

			$anchorWrapper
				.removeClass('grve-sticky grve-go-up grve-go-down')
				.css( GRVE.anchorSticky.doTranslate(0) );

			GRVE.anchorSticky.topOffset = 0;
			GRVE.anchorSticky.topPos = 0;
			GRVE.anchorSticky.mLogoW = 0;
			GRVE.anchorSticky.mElementsW = 0;
		},
		updateParams : function(){
			var $anchor = $('.grve-anchor-menu'),
				$header = $('#grve-header'),
				stickyType = $header.data('sticky'),
				headerH = $header.outerHeight(),
				anchorT = $anchor.offset().top,
				topBarH = $('#grve-top-bar').length && stickyType != 'none' ? $('#grve-top-bar').outerHeight() : 0,
				frameSize = $('#grve-frames').length && !GRVE.anchorSticky.device ? $('#grve-frames').data('frame-size') : 0,
				$mLogo = $('#grve-movedo-sticky-header .grve-logo'),
				$mElements = $('#grve-movedo-sticky-header .grve-header-elements-wrapper');

			GRVE.anchorSticky.topOffset = anchorT - topBarH - frameSize - wpBarHeight;
			GRVE.anchorSticky.topPos = topBarH + frameSize + wpBarHeight;
			GRVE.anchorSticky.mLogoW = $mLogo.length ? $mLogo.outerWidth() + frameSize : 0;
			GRVE.anchorSticky.mElementsW = $mElements.length ? $mElements.outerWidth() + frameSize : 0;

		},
		getHeaderH : function(){
			var headerH = 0,
				$header = $('#grve-header'),
				device = GRVE.anchorSticky.device;

			if( !device ){
				var $mainHeader = $('#grve-main-header'),
					stickyType = $header.data('sticky');
				if( stickyType != 'none' && stickyType != 'advanced' && stickyType != 'movedo' ) {
					if( $header.hasClass('grve-sticky-header') ) {
						headerH = $header.data('sticky-height');
					} else {
						headerH = $header.outerHeight();
					}
				}
			} else {
				var $mainHeader = $('#grve-responsive-header'),
					stickyType = $header.data('devices-sticky');
				if( stickyType == 'yes' ) {
					headerH = $header.data('devices-sticky-height');
				}
			}

			return headerH;

		},
		update : function(){
			var $anchor = $('.grve-anchor-menu'),
				$header = $('#grve-header'),
				$anchorWrapper = $anchor.find('.grve-anchor-wrapper'),
				stickyType = $header.data('sticky'),
				device = GRVE.anchorSticky.device;

			var scroll = $(window).scrollTop(),
				topOffset = GRVE.anchorSticky.topOffset - GRVE.anchorSticky.getHeaderH(),
				topPos = GRVE.anchorSticky.topPos + GRVE.anchorSticky.getHeaderH(),
				positionY = $header.data('sticky-height'),
				sticky = false;

			if( scroll >= topOffset ){
				sticky = true;
				$anchorWrapper
					.addClass('grve-sticky')
					.css({'top' : topPos});
			} else {
				sticky = false;
				$anchorWrapper
					.removeClass('grve-sticky')
					.css({'top' : ''});
			}

			if( !device ){
				if( stickyType == 'movedo' ){
					GRVE.anchorSticky.movedoAnchor(sticky);
				}

				if(sticky && $header.hasClass('grve-scroll-up') ){
					$anchorWrapper
						.addClass('grve-go-down')
						.removeClass('grve-go-up')
						.css( GRVE.anchorSticky.doTranslate(positionY) );
				} else if(sticky && $header.hasClass('grve-scroll-down') ){
					$anchorWrapper
						.addClass('grve-go-up')
						.removeClass('grve-go-down')
						.css( GRVE.anchorSticky.doTranslate(0) );
				} else {
					$anchorWrapper
						.removeClass('grve-go-up')
						.removeClass('grve-go-down')
						.css( GRVE.anchorSticky.doTranslate(0) );
				}
			}
		},
		doTranslate : function(value){
			return {
				'-webkit-transform' : 'translate3d(0px, ' + value + 'px, 0px) translateZ(0)',
				'-moz-transform'    : 'translate3d(0px, ' + value + 'px, 0px) translateZ(0)',
				'-ms-transform'     : 'translate3d(0px, ' + value + 'px, 0px) translateZ(0)',
				'-o-transform'      : 'translate3d(0px, ' + value + 'px, 0px) translateZ(0)',
				'transform'         : 'translate3d(0px, ' + value + 'px, 0px) translateZ(0)'
			};
		},
		movedoAnchor : function(sticky){
			var $anchor = $('.grve-anchor-menu'),
				$header = $('#grve-header'),
				$anchorWrapper = $anchor.find('.grve-anchor-wrapper'),
				leftPos = $('body').hasClass('grve-boxed') ? 'auto' : GRVE.anchorSticky.mLogoW + 2,
				rightPos = $('body').hasClass('grve-boxed') ? 'auto' : GRVE.anchorSticky.mElementsW + 2,
				size = $('body').hasClass('grve-boxed') ? '' : 'auto',
				headerH = $header.data('sticky-height');

			if( sticky ) {
				$anchorWrapper.css({
					'line-height' : headerH - 2 +'px',
					'left' : leftPos,
					'right' : rightPos,
					'width' : size,
					'z-index' : 9999
				}).addClass('grve-movedo-anchor');
			}
			if( sticky && $header.hasClass('grve-scroll-up') ) {
				$anchorWrapper.css({
					'line-height' : '',
					'left' : '',
					'right' : '',
					'width' : '',
					'z-index' : ''
				});
			}
		}
	};
	// # Menu Slide or Toggle
	// ============================================================================= //
	GRVE.slideToggleMenu = {

		init: function( parrent, element ){

			if( !$(element).length ) return;

			var $menu       = $(element),
				$menuParent = $(parrent),
				$menuItem   = $menu.find('li.menu-item-has-children > a'),
				menuType    = $menuParent.hasClass('grve-slide-menu') ? 'slide' : 'toggle',
				$arrow      = $('<i class="grve-arrow"></i>'),
				$goBack     = $('<li class="grve-goback"><a href="#" aria-label="' + movedo_grve_main_data.string_back_to_top + '"><i class="grve-arrow"></i></a></li>');



			if( menuType === 'slide' ) {
				// Add Arrows
				$arrow.appendTo( $menuItem.parent() );
				// Add Go Back Button for Slide Menu
				$goBack.prependTo( $menuItem.parent().find('>ul') );
			} else {
				// Add Arrows
				$menuItem.wrap('<div class="grve-toggle-menu-item-wrapper"></div>');
				$arrow.appendTo( $menuItem.parent() );
				$menuItem   = $menu.find('li.menu-item-has-children .grve-toggle-menu-item-wrapper > a');
			}

			$menuItem.on('tap click',function(e){
				var $this = $(this),
					link  = $this.attr('href');

				if( link === '#' && menuType == 'toggle' ) {
					e.preventDefault();
					if( !$this.parent().hasClass('open') ) {
						$this.parent().addClass('open');
						toggle( $this.parent(), false );
					} else if( $this.parent().hasClass('open') ) {
						toggle( $this.parent(), true );
						$this.parent().removeClass('open');
					}
				} else if( link === '#' && menuType == 'slide' ) {
					e.preventDefault();
					var listLevel  = $this.parents('ul').length,
						$firstItem = $this.parent().find('ul').first(),
						menuOffset = $menu.offset().top,
						offset     = $this.offset().top,
						title      = $this.html();

						appendTitle( title, $firstItem );

					$firstItem.addClass('show').css({ 'top' : - ( offset - menuOffset ) });
					var firstItemH = $firstItem.outerHeight();

					if( $('body').hasClass('rtl') ) {
						animRightMenu( firstItemH, listLevel );
					} else {
						animLeftMenu( firstItemH, listLevel );
					}
				}

			});

			if( menuType === 'toggle' ) {
				var $arrowBtn = $menuItem.parent().find('.grve-arrow');
				$arrowBtn.on('click',function(){
					var $this = $(this);
					if( !$this.parent().hasClass('open') ) {
						$this.parent().addClass('open');
						toggle( $this.parent(), false );
					} else if( $this.parent().hasClass('open') ) {
						toggle( $this.parent(), true );
						$this.parent().removeClass('open');
					}

				});

			} else if( menuType === 'slide' ) {
				var $arrowBtn = $menuItem.parent().find('.grve-arrow');
				$arrowBtn.on('click',function(){
					var $this = $(this),
						listLevel  = $this.parents('ul').length,
						$firstItem = $this.parent().find('ul').first(),
						menuOffset = $menu.offset().top,
						offset     = $this.offset().top,
						title      = $this.parent().find('a').first().html();

					appendTitle( title, $firstItem );

					$firstItem.addClass('show').css({ 'top' : - ( offset - menuOffset ) });
					var firstItemH = $firstItem.outerHeight();

					if( $('body').hasClass('rtl') ) {
						animRightMenu( firstItemH, listLevel );
					} else {
						animLeftMenu( firstItemH, listLevel );
					}

				});
			}

			$('li.grve-goback a').on('click', function(e) {
				e.preventDefault();
				var listLevel  = $(this).parents('ul ul').length - 1,
					$firstItem = $(this).closest('.sub-menu'),
					firstItemH = $firstItem.closest('.menu-item-has-children').closest('ul').height();

				setTimeout(function(){
					$firstItem.removeClass('show');
				},300);
				if( $('body').hasClass('rtl') ) {
					animRightMenu( firstItemH, listLevel );
				} else {
					animLeftMenu( firstItemH, listLevel );
				}
			});

			function toggle( $this, open ){
				var $subMenu = $this.parent().find('>ul');
				if( open ) {
					$subMenu.slideUp(200);
				} else {
					$subMenu.slideDown(200);
				}
			}

			function animLeftMenu( height, listLevel ) {
				$menu.parent().height(height);
				$menu.css('transform', 'translate3d(' + - listLevel * 100 + '%,0,0)');
			}

			function animRightMenu( height, listLevel ) {
				$menu.parent().height(height);
				$menu.css('transform', 'translate3d(' + listLevel * 100 + '%,0,0)');
			}

			function appendTitle( title, list ){
				if( list.find('.grve-goback .grve-item').length ) return;
				$(title).appendTo( list.find('> .grve-goback a') );
			}
		}

	};

	// # Set Feature Section Size
	// ============================================================================= //
	GRVE.featureSize = {
		init: function( section ){
			this.$section = $(section);
			this.topBar = $('#grve-top-bar');
			this.header = $('#grve-header');
			this.responsiveHeader = $('#grve-responsive-header');
			this.frameSize = $('body').hasClass('grve-framed') ? $('#grve-frames').data('frame-size') : 0;
			this.updateParams();
			var featureHeight;

			if( this.$section.hasClass('grve-fullscreen') ) {
				featureHeight = this.fullscreenSize();
			} else if( this.$section.hasClass('grve-custom-size') ) {
				featureHeight = this.customSize();
			}
		},
		updateParams : function(){
			this.windowH = $(window).height();
			this.topBarH = this.getTopBarHeight();
			this.headerH = this.getHeaderHeight();
		},
		getTopBarHeight : function(){
			var height = 0;
				if( this.topBar.length && !this.topBar.hasClass('grve-sticky-topbar') ) {
					height = this.topBar.outerHeight();
				}
			return height;
		},
		getHeaderHeight : function(){
			var height = 0;

			if( this.header.length && this.header.is(':visible') && !this.header.hasClass('grve-overlapping') && !this.header.hasClass('grve-header-below') ) {
				height = this.header.outerHeight();
			}

			if( this.responsiveHeader.length && this.responsiveHeader.is(':visible') && !this.header.hasClass('grve-responsive-overlapping') && !this.header.hasClass('grve-header-below') ) {
				height = this.responsiveHeader.outerHeight();
			}

			return height;
		},
		fullscreenSize : function(){
			var sectionH = this.windowH - this.headerH - this.topBarH - (this.frameSize * 2);
			this.$section.css( 'height', sectionH).find('.grve-wrapper').css( 'height', sectionH);
			return sectionH;
		},
		customSize : function(){
			var initHeight = this.$section.data('height'),
				newHeight  = ((this.windowH * initHeight) / 100);
			if( newHeight > this.windowH ) {
				newHeight = this.windowH;
			}
			this.$section.css( 'height', newHeight).find('.grve-wrapper').css( 'height', newHeight);
			return newHeight;
		}
	};

	// # Feature Section
	// ============================================================================= //
	GRVE.featureSection = {
		init : function(section){
			var $section = $(section),
				$bgImage = $section.find('.grve-bg-image'),
				$bgVideo = $section.find('.grve-bg-video'),
				$spinner = $(spinner),
				animateContent = false;

			if( $bgImage.length ) {
				// Load Background Images
				loadFeatureImage();
				// Add Spinner
				if( addFeatureSpinner ) {
					addSpinner();
				}
			} else if( !$bgImage.length && $bgVideo.length ) {
				// Add Spinner
				if( addFeatureSpinner ) {
					addSpinner();
				} else {
					showFeature();
				}
			} else {
				// Play Animation Content
				featureAnimation( $section );
			}

			// Load Background Images
			function loadFeatureImage(){
				var totalBgImage = $bgImage.length,
					waitImgDone = function() {
						totalBgImage--;
						if (!totalBgImage) {
							// Remove Spinner
							if( addFeatureSpinner ) {
								setTimeout(function () {
									removeSpinner();
								}, 600);
							} else {
								showFeature();
							}
						}
					};
				$bgImage.each(function () {
					function imageUrl(input) {
						if (input.indexOf('image-set') !== -1) {
							var m = input.match(/["']([^"']+\.jpe?g)["']/i);
							if (m) return m[1];
						}
						return input.replace(/"/g,"").replace(/url\(|\)$/ig, "");
					}
					var image = new Image(),
						$that = $(this);
					image.src = imageUrl($that.css('background-image'));
					$(image).on('load',waitImgDone).on( "error", waitImgDone );
				});
			}

			// Add Spinner
			function addSpinner(){
				$spinner.appendTo( $section );
				$section.addClass('grve-with-spinner');
			}

			// Remove Spinner
			function removeSpinner(){
				$spinner.fadeOut(900,function(){
					$spinner.remove();
					// Show Feature Section
					showFeature();
				});
			}

			// Show Feature Section
			function showFeature(){
				var $overlay   = $section.find('.grve-bg-overlay'),
					$content   = $section.find('.grve-content'),
					$bgImage   = $section.find('.grve-bg-image'),
					$bgVideo   = $section.find('.grve-bg-video');

				$bgImage.addClass('show');
				$bgVideo.addClass('show');
				$overlay.addClass('show');

				animateContent = true;
				featureAnimation( $section );
			}

			// Feature Animation
			function featureAnimation(section){
				var $section = section,
					$wrapper = $section.find('.grve-title-content-wrapper'),
					effect = $section.find('.grve-content').data('animation'),
					effectClass = 'grve-animate-' + effect,
					delay = 200,
					cnt = 0,
					contentItems = {
						graphic     : $section.find(' .grve-graphic '),
						subheading  : $section.find(' .grve-subheading '),
						title       : $section.find(' .grve-title '),
						description : $section.find(' .grve-description '),
						titleMeta   : $section.find(' .grve-title-meta-content '),
						button1     : $section.find(' .grve-btn-1 '),
						button2     : $section.find(' .grve-btn-2 '),
						gotoArrow   : $section.find(' #grve-goto-section-wrapper ')
					};

				// Show Content
				$section.find('.grve-content').addClass('show');

				if( !$wrapper.hasClass('grve-bg-none') ){
					contentItems = {
						wrapper : $wrapper,
						gotoArrow   : $section.find(' #grve-goto-section-wrapper ')
					};
				}

				// Add Animation Class
				$.each( contentItems, function( key, item ) {
					$(item).removeClass('grve-animate-fade-in grve-animate-fade-in-up grve-animate-fade-in-down grve-animate-fade-in-left grve-animate-fade-in-right grve-animate-zoom-in grve-animate-zoom-out');

					if( $(item).length ){
						cnt++;
						if( effect != 'none' ){
							setTimeout(function(){
								$(item).addClass( effectClass );
							},cnt * delay);
						}
					}
				});
			}
		}
	};

	// # Page Settings
	// ============================================================================= //
	GRVE.pageSettings = {

		init: function(){
			this.mainMenu();
			this.columnFullHeight();
			this.columnCustomSize();
			this.setClippingWrappers();
			this.grveModal();
			this.bgLoader();
			this.imageLoader();
			this.hiddenArea();
			this.backtoTop();
			this.onePageSettings();
		},
		setClippingWrappers: function(){
			var $element = $('.grve-clipping-animation'),
				wrapper = '<div class="grve-clipping-wrapper"><div class="grve-clipping-content"></div></div>';
			if( isMobile.any() && !deviceAnimAppear ) {
				$element.removeClass('grve-clipping-animation');
			} else {
				$element.wrapInner( wrapper );
				$element.each(function(){
					var $that = $(this),
						$wrapper = $that.find('.grve-clipping-wrapper');
					if( $that.hasClass('grve-colored-clipping') ) {
						var color = $that.data('clipping-color'),
							overlay = '<div class="grve-clipping-overlay grve-bg-' + color + '"></div>';
						$(overlay).appendTo( $wrapper );
					}
				});
				this.clippingAppear();
			}
		},
		clippingAppear: function(){
			var $clippingEl = $('.grve-clipping-animation');
			if( bodyLoader || $('body').hasClass('page-template-template-full-page') || $('body').hasClass('page-template-template-pilling-page') ){
				return;
			}
			if( isMobile.any() && !deviceAnimAppear ) {
				$clippingEl.removeClass('grve-clipping-animation');
			} else {
				$clippingEl.each(function() {
					var $that = $(this),
						timeDelay = $that.attr('data-delay');

					$that.appear(function() {
						setTimeout(function () {
							GRVE.pageSettings.clippingAnimated( $that );
						}, timeDelay);
					},{accX: 0, accY: -150});
				});
			}
		},
		clippingAnimated: function( $element ){
			var delay = 700,
				$overlay = $element.find( '.grve-clipping-overlay' );

			$element.addClass('grve-clipping-animated');

			if ( $element.hasClass('grve-colored-clipping') ) {
				setTimeout(function(){
					$element.addClass('grve-clipping-show-content');
				},delay);

				delay = 1400;
			}
			setTimeout(function(){
				$overlay.remove();
				$element.removeClass('grve-clipping-animation grve-clipping-animated grve-colored-clipping grve-clipping-show-content');
				GRVE.basicElements.animAppear();
			},delay);
		},
		addVideoBg: function(){
			$('.grve-yt-bg-video').each(function() {
				var $element = $(this);
				var url = $element.data("video-bg-url");
				var videoID = url.match( /[\\?&]v=([^&#]*)/ )[ 1 ];
				if( '' != videoID ) {
					insertYouTubeVideo($element, videoID );
				}
			});
			$('.grve-html5-bg-video').each(function() {
				var $element = $(this);
				GRVE.pageSettings.resizeVideoBgElement( $element );
			});
			function insertYouTubeVideo($element, youtubeId, counter) {
				if ("undefined" == typeof YT || "undefined" === typeof YT.Player) {
					counter = "undefined" === typeof counter ? 0 : counter;
					if (100 < counter) {
						console.warn("Too many attempts to load YouTube api");
						return;
					}
					setTimeout(function() {
						insertYouTubeVideo($element, youtubeId, counter++);
					}, 100);
					return;
				}
				var startSeconds = $element.data('video-start') != undefined ? parseInt( $element.data('video-start') ) : 0;
				var endSeconds = $element.data('video-end') != undefined ? parseInt( $element.data('video-end') ) : 0;
				var $container = $element.prepend('<div class="grve-bg-youtube-video"><div class="inner"></div></div>').find(".inner");
				var ytPlayer = new YT.Player($container[0], {
					width: "100%",
					height: "100%",
					videoId: youtubeId,
					playerVars: {
						playlist: youtubeId,
						iv_load_policy: 3,
						enablejsapi: 1,
						disablekb: 1,
						autoplay: 1,
						controls: 0,
						showinfo: 0,
						rel: 0,
						loop: 1,
						start: startSeconds,
						end: endSeconds,
						wmode: "transparent"
					},
					events: {
						'onReady': onPlayerReady,
						'onStateChange': onPlayerStateChange
					}
				});
				function onPlayerReady(event) {
					event.target.mute().setLoop(true);
				}
				function onPlayerStateChange(event) {
					if ( 0 != startSeconds || 0 != endSeconds ) {
						if (event.data === YT.PlayerState.ENDED) {
							ytPlayer.loadVideoById({
								videoId: youtubeId,
								startSeconds: startSeconds,
								endSeconds: endSeconds
							});
						}
					}
				}
				// Resize Video
				GRVE.pageSettings.resizeVideoBgElement( $element );
			}
		},
		resizeVideoBg: function(){
			$videoBg.each(function(){
				GRVE.pageSettings.resizeVideoBgElement( $(this) );
			});
		},
		resizeVideoBgElement: function( $element ){
			var videoEl,
				videoW,
				videoH,
				marginLeft,
				marginTop,
				containerW = $element.innerWidth(),
				containerH = $element.innerHeight(),
				ratio1 = 16,
				ratio2 = 9;

			if (containerW / containerH < ratio1 / ratio2) {
				videoW = containerH * (ratio1 / ratio2);
				videoH = containerH;
				videoW += 'px';
				videoH += 'px';
			} else {
				videoW = containerW;
				videoH = containerW * (ratio2 / ratio1);
				videoW += 'px';
				videoH += 'px';
			}
			if( $element.hasClass('grve-yt-bg-video') || $element.hasClass('grve-iframe-bg-video') ) {
				videoEl = 'iframe';
			} else {
				videoEl = 'video';
			}

			$element.find( videoEl ).css({
				maxWidth: '1000%',
				width: videoEl == 'iframe' ? videoW : '',
				height: videoH
			});
		},
		removeVideoBg: function(){
			$('.grve-background-wrapper').each(function () {
				var $wrapper = $(this),
					$bgImage = $wrapper.find('.grve-bg-image'),
					$bgVideo = $wrapper.find('.grve-bg-video'),
					$bgHtml5Video = $wrapper.find('.grve-html5-bg-video'),
					$bgYtVideo = $wrapper.find('.grve-yt-bg-video'),
					$bgIFrameVideo = $wrapper.find('.grve-iframe-bg-video'),
					$bgVideoButton = $wrapper.find('.grve-bg-video-button-device');

				var bgVideoDevice = $bgVideo.data('videoDevice') != undefined ? $bgVideo.data('videoDevice') : 'no';
				if( isMobile.any() && 'no' === bgVideoDevice) {
					$bgVideo.remove();
				} else {

					if ( $bgHtml5Video.length ) {
						var $videoElement = $wrapper.find('.grve-bg-video video');
						var canPlayVideo = false;
						$wrapper.find('.grve-bg-video source').each(function(){
							if ( $videoElement.get(0).canPlayType( $(this).attr('type') ) ) {
								canPlayVideo = true;
							}
						});
						if(canPlayVideo) {
							$bgImage.remove();
						} else {
							$bgVideo.remove();
						}
					}
					if ( $bgYtVideo.length || $bgIFrameVideo.length ) {
						$bgImage.remove();
					}
					if ( $bgVideoButton.length ) {
						$bgVideoButton.remove();
					}
				}
			});

		},
		linkGoToTop: function( element, delay, space ){

			var $this = element,
				elementTop       = $this.offset().top,
				header           = $('#grve-header').length && $('#grve-main-header').is(":visible") ? true : false,
				responsiveHeader = $('#grve-responsive-header').length && $('#grve-responsive-header').is(":visible") ? true : false,
				headerHeight     = header && $('#grve-header').data('sticky') != 'none' ? $('#grve-main-header').outerHeight() : 0,
				movedoStickyH    = $('#grve-header').data('sticky') == 'movedo' && $('#grve-header').hasClass('grve-sticky-header') ? $('#grve-header').data('sticky-height') : 0,
				respHeaderH      = responsiveHeader && $('#grve-header').data('devices-sticky') == 'yes' ? $('#grve-responsive-header').outerHeight() : 0,
				topBarHeight     = $('#grve-top-bar').length ? $('#grve-top-bar').height() : 0,
				anchorBarHeight  = $('.grve-anchor-menu').length ? $('.grve-anchor-menu').outerHeight() : 0,
				delayAnim        = delay != undefined ? delay : 300,
				topSpace         = space != undefined ? space : 0,
				offset           = topBarHeight + wpBarHeight + headerHeight + movedoStickyH + respHeaderH + anchorBarHeight + topSpace;

			if( elementTop > 0 ){
				$('html, body').delay(delayAnim).animate({
					scrollTop: elementTop - offset
				}, 900, 'easeInOutCubic');
				$("html, body").bind("scroll mousedown DOMMouseScroll mousewheel keyup", function(){
					$('html, body').stop();
				});
				return false;
			}
		},
		mainMenu: function(){
			var $mainMenu = $('#grve-header .grve-horizontal-menu ul.grve-menu');

			$('.grve-main-menu').find( 'a[href="#"]').on('click',function(e){
				e.preventDefault();
			});

			$mainMenu.superfish({
				popUpSelector: '.sub-menu',
				delay: 300,
				speed: 'fast',
				cssArrows: false,
				onBeforeShow: function(){
					var $subMenu = $(this);
					if( !$subMenu.length ) return;
					var $li = $subMenu.parent(),
						windowW = $(window).width(),
						subMenuW = $subMenu.width(),
						liOffsetL = $li.offset().left;

					if( $li.hasClass('megamenu')){
						setTimeout(function(){
							setEqualMenuColumns( $li );
						},50);
					}

					if( $li.hasClass('megamenu') && $li.css('position') == 'relative' ){
						if(subMenuW + liOffsetL > windowW) {
							var left = windowW - (subMenuW + liOffsetL);
							$subMenu.css({'left' : left});
						}
					}
					if( $('#grve-header .grve-first-level').length > 0 ){
						if( !$li.hasClass('grve-first-level') && !$li.hasClass('megamenu') ){
							var subMenuLength = $li.find('.sub-menu').length + 1,
								subMenuOffsetL = $li.parents('.grve-first-level').offset().left;
							if( (subMenuW * subMenuLength) + subMenuOffsetL > windowW) {
								$li.addClass('grve-invert');
							}
						}
					}
					if( $('body').hasClass('grve-boxed') && ( $li.hasClass('megamenu column-3') || $li.hasClass('megamenu column-2') ) ){
						var containerW = $('#grve-theme-wrapper').width(),
							containerL = $('#grve-theme-wrapper').offset().left,
							positionL = 0;

						if( subMenuW + liOffsetL > containerW + containerL ){
							positionL = (containerW + containerL) - (subMenuW + liOffsetL);
						}

						$subMenu.css({
							'left' : positionL
						});
					}
				},
				onHide: function(){
					var $subMenu = $(this),
						$li = $subMenu.parent();
					$li.removeClass('grve-invert');
				}
			});

			function setEqualMenuColumns( $li ) {
				var $subMenu = $li.children('ul'),
					$column = $subMenu.children('li'),
					maxHeight = 0;
				$column.each(function(){
					var columnH = $(this).outerHeight();
					if( columnH >= maxHeight ) {
						maxHeight = columnH;
					}
				});
				$column.css({ 'height' : maxHeight });
			}

		},
		columnFullHeight: function(){
			var $column = $('.grve-column-fullheight');

			$column.each(function(){
				var $that = $(this),
					fullTabletL = $that.data('tablet-landscape-fullheight') != undefined ? false : true,
					fullTabletP = $that.data('tablet-portrait-fullheight') != undefined ? false : true,
					fullMobileL = $that.data('mobile-fullheight') != undefined ? false : true;

				$that.columnSize({
					equal: false,
					middleContent: false,
					fullHeight: true,
					fullTabletL : fullTabletL,
					fullTabletP : fullTabletP,
					fullMobileL : fullMobileL
				});
			});
		},
		columnCustomSize: function(){
			var $section = $('.grve-section.grve-custom-height');
			$section.each(function(){
				var $that = $(this),
					equal = false,
					middle = false,
					fullHeight = false,
					equalTabletL = true,
					equalTabletP = true,
					equalMobileL = true,
					fullTabletL = true,
					fullTabletP = true,
					fullMobileL = true;

				if( $that.hasClass('grve-equal-column') || $that.hasClass('grve-middle-content') ){
					equal = true;
					equalTabletL = $that.data('tablet-landscape-equal-columns') != undefined ? false : true;
					equalTabletP = $that.data('tablet-portrait-equal-columns') != undefined ? false : true;
					equalMobileL = $that.data('mobile-equal-columns') != undefined ? false : true;
				}
				if( $that.hasClass('grve-middle-content') ){
					middle = true;
				}
				if( $that.hasClass('grve-fullheight') ){
					fullHeight = true;
					fullTabletL = $that.data('tablet-landscape-fullheight') != undefined ? false : true;
					fullTabletP = $that.data('tablet-portrait-fullheight') != undefined ? false : true;
					fullMobileL = $that.data('mobile-fullheight') != undefined ? false : true;
				}
				$that.columnSize({
					equal : equal,
					middleContent : middle,
					fullHeight : fullHeight,
					equalTabletL : equalTabletL,
					equalTabletP : equalTabletP,
					equalMobileL : equalMobileL,
					fullTabletL : fullTabletL,
					fullTabletP : fullTabletP,
					fullMobileL : fullMobileL
				});
			});
		},
		grveModal: function(){

			var $button       = $('.grve-toggle-modal'),
				$overlay      = $('<div id="grve-modal-overlay" class="grve-body-overlay"></div>'),
				$closeBtn     = $('<div class="grve-close-modal"><i class="grve-icon-close"></i></div>'),
				$themeWrapper = $('#grve-theme-wrapper'),
				content;

			$button.on('click',function(e){
				content = $(this).attr('href');
				if( content.indexOf("#") === 0 && $(content).length > 0 ) {
					e.preventDefault();

					// Append Overlay on body
					$overlay.appendTo( $themeWrapper );
					// $closeBtn.appendTo( $(content) );

					$(content).addClass('prepare-anim');

					openModal();

					$closeBtn.on('click',function(e){
						e.preventDefault();
						closeModal();
					});

					$(content).on('click',function(e){
						if ( !$('.grve-modal-item').is(e.target) && $('.grve-modal-item').has(e.target).length === 0 ) {
							e.preventDefault();
							closeModal();
						}
					});
				}
			});

			// Search Modal
			var $searchContent = $('#grve-search-modal'),
				$placeholder = $('.grve-search-placeholder'),
				$typedEl = $searchContent.find('.grve-search-placeholder'),
				$searchButton = $searchContent.find('.grve-search-btn'),
				$searchTextField = $searchContent.find('.grve-search-textfield'),
				typedContent = $typedEl.html(),
				typedText = false;

			// Clear Typed Html
			if ( $placeholder.hasClass('grve-typed-placeholder') ) {
				$typedEl.html('');
			}

			$placeholder.on('click',function(){
				$typedEl.addClass('hide');
				$searchTextField.show().focus();
			});

			// Open Modal
			function openModal() {
				$overlay.fadeIn(function(){
					$(content).addClass('animate');

					// Search Typed Title
					if( $(content).is('#grve-search-modal') ){
						$searchTextField.val('');
						if( $placeholder.hasClass('grve-typed-placeholder') ){
							typedTitle();
						} else {
							staticTitle();
						}
					}
				});
			}

			// Close Modal
			function closeModal() {
				$(content).removeClass('animate mobile');
				setTimeout(function(){
					$overlay.fadeOut(function(){
						$(content).removeClass('prepare-anim');
						$overlay.remove();
						$closeBtn.remove();

						// Search Modal Remove Classes
						if( $(content).is('#grve-search-modal') ){
							if ( $placeholder.hasClass('grve-typed-placeholder') ) {
								$typedEl.removeClass('hide').html('');
								$searchTextField.hide();
								$searchButton.removeClass('show');
								typedText = false;
							} else {
								$typedEl.removeClass('hide');
								$searchTextField.hide();
							}
						}
					});
				},600);
			}

			function typedTitle(){

				if(!typedText){
					typedText = true;
					$typedEl.data('typed', null).typed({
						strings: [typedContent],
						showCursor: false,
						typeSpeed: 60,
						callback: function() {
							$searchButton.addClass('show');
						}
					});
				}
			}
			function staticTitle(){
				$typedEl.addClass('show');
				$searchButton.addClass('show');
			}

			$(document).on('keyup',function(evt) {
				if (evt.keyCode == 27 && $(content).hasClass('animate') ) {
					closeModal();
				}
			});

		},
		bgLoader: function() {

			var $selector = $('#grve-header .grve-bg-image, #grve-content .grve-bg-image, #grve-footer .grve-bg-image, .grve-navigation-bar .grve-bg-image, #grve-sidearea .grve-bg-image, #grve-safebutton-area .grve-bg-image');
			$selector.each(function () {
				var $selector = $(this);
				if( $selector.data('loader') == 'yes' ){
					GRVE.pageSettings.addSpinner( $selector );
				}
				function imageUrl(input) {
					if (input.indexOf('image-set') !== -1) {
						var m = input.match(/["']([^"']+\.jpe?g)["']/i);
						if (m) return m[1];
					}
					return input.replace(/"/g,"").replace(/url\(|\)$/ig, "");
				}
				var image = new Image(),
					$that = $(this);
				image.src = imageUrl($that.css('background-image'));
				image.onload = function () {
					if( $selector.data('loader') == 'yes' ){
						GRVE.pageSettings.removeSpinner( $selector );
					} else {
						$that.addClass('show');
					}
				};
			});
		},
		imageLoader: function(){
			var selectors  = {
				singleImage  : '.grve-image',
				media        : '.grve-media'
			};
			$.each(selectors, function(key, value){
				if( $(this).length ){
					var item     = $(this),
						imgLoad  = imagesLoaded( item );
					imgLoad.on( 'always', function() {
						$(value).find('img').animate({ 'opacity': 1 },1000);
					});
				}
			});
		},
		addSpinner: function( $selector ){
			var $section = $selector;
			$(spinner).appendTo( $section.parent() );
		},
		removeSpinner: function( $selector ){

			var $section   = $selector.parent(),
				$spinner   = $section.find('.grve-spinner');

			$spinner.fadeOut(600,function(){
				$selector.addClass('show');
				$spinner.remove();
			});
		},
		hiddenArea: function(){
			var $btn          = $('.grve-toggle-hiddenarea'),
				$themeWrapper = $('#grve-theme-wrapper'),
				$closeBtn     = $('.grve-hidden-area').find('.grve-close-btn'),
				startTimer = false,
				itemLength = 0,
				areaWidth = 0,
				content,
				$overlay;

			$btn.on('click',function(e){
				content = $(this).attr('href');
				if( content.indexOf("#") === 0 && $(content).length > 0 ) {
					e.preventDefault();

					$(content).each(function(){
						var $content = $(this);
						var overlayId = $content.attr('id');

						$content.addClass('prepare-anim');
						$overlay = $('<div id="' + overlayId + '-overlay" class="grve-body-overlay"></div>');

						// Append Overlay on body
						$overlay.appendTo( $themeWrapper );

						// Calculate Width
						areaWidth = hiddenAreaWidth( $content );
						$(window).smartresize(function(){
							areaWidth = hiddenAreaWidth( $content );
						});

						// Menu First Level Animation
						if(hiddenMenuItemsAnimation){
							$content.addClass('grve-animated-menu-items');
						}
						setTimeout(function(){
							if(hiddenMenuItemsAnimation){
								animMenuItems( $content );
							}
						},1000);

						if( $content.hasClass('open') ) {
							closeHiddenArea();
						} else {
							openHiddenArea();
						}

						// For One Page
						var $link = $content.find('a[href*="#"]:not( [href="#"] )');
						$link.on('click',function(){
							var target = $(this.hash),
								targetHash = this.hash,
								dataValue = this.hash.replace('#','');
							if ( target.length && ( target.hasClass('grve-section') || target.hasClass('grve-bookmark') || target.hasClass('grve-tab-content') || target.hasClass('grve-accordion-content') ) ) {
								closeHiddenArea();
							}
							// For Fullpage Scrolling
							if( $('[data-anchor="' + dataValue + '"]').length ){
								closeHiddenArea();
							}
							//For go to header
							if( 'grve-goto-header' == dataValue ){
								closeHiddenArea();
							}
						});

					});
				}
			});

			$closeBtn.on('click',function(){
				closeHiddenArea();
			});

			// Open Hidden Area
			function openHiddenArea() {
				$overlay.fadeIn(function(){
					$(window).trigger('grve_open_hidden_area');
					$('.grve-hiddenarea-wrapper').scrollTop( 0 );
					$(content).addClass('open');
					$(this).on('click',function(){
						closeHiddenArea();
					});
				});
			}
			// Close Hidden Area
			function closeHiddenArea() {
				$themeWrapper.css({ 'height' : 'auto' });
				$(content).removeClass('open');
				$overlay.fadeOut(function(){
					$overlay.remove();
					$(content).removeClass('prepare-anim');
					$(window).trigger('grve_close_hidden_area');
				});
			}
			// Calculate Area Width
			function hiddenAreaWidth( $area ){
				var windowWidth  = $(window).width();

				if( $(window).width() + scrollBarWidth <= mobileScreen ) {
					$area.css({ 'width' : windowWidth + 30 });
				} else {
					if( $area.hasClass('grve-large-width') ) {
						$area.css({ 'width' : Math.max(hiddenaAreaMinWidth, (windowWidth / 2)) });
					} else if( $area.hasClass('grve-medium-width') ) {
						$area.css({ 'width' : Math.max(hiddenaAreaMinWidth, (windowWidth / 3)) });
					} else {
						$area.css({ 'width' : Math.max(hiddenaAreaMinWidth, (windowWidth / 4)) });
					}
				}

				return areaWidth;
			}

			// Menu First Level Animation
			function animMenuItems( $area ) {
				var $menu = $area.find('ul.grve-menu'),
					$firstLevel = $menu.find('li.grve-first-level'),
					itemLength = $firstLevel.length,
					count = -1,
					counter;

				if( itemLength > 0 && !startTimer ){
					startTimer = true;
					counter = setInterval(function(){
						timer($firstLevel);
					}, 200);
				}

				function timer($menuItem){
					count += 1;
					if (count >= itemLength) {
						clearInterval(counter);
						startTimer = false;
					}
					$menuItem.eq(count).addClass('show');
				}
			}

		},
		backtoTop: function() {
			var selectors  = {
				topBtn     : '.grve-back-top',
				dividerBtn : '.grve-divider-backtotop',
				topLink    : 'a[href="#grve-goto-header"]'
				},
				footerBarHeight = $('.grve-footer-bar.grve-fullwidth').length ? $('.grve-footer-bar.grve-fullwidth').outerHeight() : 0;

				if( $( selectors.topBtn ).length ) {

					$(window).on('scroll', function() {
						var scroll = $(this).scrollTop(),
							$topBtn = $( selectors.topBtn );

						if (scroll > 600) {
							$topBtn.addClass('show');
						} else {
							$topBtn.removeClass('show');
						}
						if( scroll + $(window).height() > $(document).height() - footerBarHeight ) {
							$topBtn.css({ 'transform': 'translate(0, ' + -( footerBarHeight + 80 ) + 'px)' });
						} else {
							$topBtn.css({ 'transform': '' });
						}

					});
				}

			$.each(selectors, function(key, value){
				$(value).on('click', function(e){
					e.preventDefault();
					if( $('#grve-header').data('sticky') === 'movedo' ){
						goToTop = true;
						$('#grve-header').removeClass('grve-fixed grve-sticky-header grve-sticky-animate grve-scroll-up grve-scroll-down').css({'top':''});
						$('#grve-main-header').css({'top':''});
					}
					var scrollTop = Math.abs($(window).scrollTop()) / 2,
						speed = scrollTop < 1000 ? 1000 : scrollTop;
					$('html, body').animate({scrollTop: 0}, speed, 'easeInOutCubic',function(){
						goToTop = false;
					});
				});
			});

		},
		onePageSettings: function(){
			$('a[href*="#"]:not( [href="#"] )').on('click', function(e) {
				var anchorBarHeight = $('.grve-anchor-menu').length ? $('.grve-anchor-menu').outerHeight() : 0,
					topbarH         = $('#grve-top-bar').length && ( $('#grve-top-bar').hasClass('grve-sticky-topbar') || $('#grve-top-bar').hasClass('grve-device-sticky-topbar') ) ? $('#grve-top-bar').outerHeight() : 0,
					target          = $(this.hash),
					targetHash      = this.hash;

				if( $("#grve-responsive-header").is(":visible") ) {
					var headerHeight = $('#grve-header').length && $('#grve-header').data('devices-sticky') != 'no' ? $('#grve-header').data('devices-sticky-height') : 0;
				} else {
					var headerHeight = $('#grve-header').length && $('#grve-header').data('sticky') != 'none' ? $('#grve-header').data('sticky-height') : 0;
					if( target.length ){
						headerHeight = ( 'advanced' == $('#grve-header').data('sticky') && target.offset().top > $(this).offset().top ) ? 0 : headerHeight;
					}
				}

				if ( target.length && ( target.hasClass('grve-section') || target.hasClass('grve-bookmark') ) ) {
					$('html,body').animate({
						scrollTop: target.offset().top - headerHeight - wpBarHeight - anchorBarHeight - topbarH + 1
					}, 1000);
					return false;
				}

				if ( target.length && ( target.hasClass('grve-tab-content') || target.hasClass('grve-accordion-content') ) ) {
					var tabLink =  $('.grve-tab-link[data-rel="' + targetHash + '"]:visible');
					if ( tabLink.length ) {
						tabLink.click();
						setTimeout(function() {
							GRVE.pageSettings.linkGoToTop( tabLink );
						}, 500);
					}
					return false;
				}
			});
		},
		onePageMenu: function(){
			var $section       = $('#grve-main-content .grve-section[id]');
			if (!$section.length > 0 ) return;

			var headerHeight   = $('#grve-header').length && $('#grve-header').attr('data-sticky-header') != 'none' && !$('#grve-main-header').hasClass('grve-header-side') ? $('#grve-main-header').outerHeight() : 0,
				anchorBarHeight = $('.grve-anchor-menu').length ? $('.grve-anchor-menu').outerHeight() : 0,
				topbarH         = $('#grve-top-bar').length && ( $('#grve-top-bar').hasClass('grve-sticky-topbar') || $('#grve-top-bar').hasClass('grve-device-sticky-topbar') ) ? $('#grve-top-bar').outerHeight() : 0,
				offsetTop      = headerHeight + anchorBarHeight + topbarH + wpBarHeight,
				scroll         = $(window).scrollTop();

			$section.each(function(){
				var $that         = $(this),
					currentId     = $that.attr('id'),
					sectionOffset = $that.offset().top - offsetTop;

				if (sectionOffset <= scroll && sectionOffset + $that.outerHeight() > scroll ) {
					$('a[href*="#' + currentId + '"]').parent().addClass('active');
				}
				else{
					$('a[href*="#' + currentId + '"]').parent().removeClass("active");
				}

			});
		}
	};

	// # Basic Elements
	// ============================================================================= //
	GRVE.basicElements = {
		init: function(){
			this.counter();
			this.animAppear();
			this.accordionToggle();
			this.hovers();
		},
		counter: function(){
			if( bodyLoader === true ){
				return;
			}
			var selector = '.grve-counter-item span';
			$(selector).each(function(i){
				var elements = $(selector)[i],
					thousandsSeparator = $(this).attr('data-thousands-separator') !== '' ? $(this).attr('data-thousands-separator') : ',';
				$(elements).attr('id','grve-counter-' + i );
				var delay = $(this).parents('.grve-counter').attr('data-delay') !== '' ? parseInt( $(this).parents('.grve-counter').attr('data-delay') ) : 200,
					options = {
						useEasing    : true,
						useGrouping  : true,
						separator    : $(this).attr('data-thousands-separator-vis') !== 'yes' ? thousandsSeparator : '',
						decimal      : $(this).attr('data-decimal-separator') !== '' ? $(this).attr('data-decimal-separator') : '.',
						prefix       : $(this).attr('data-prefix') !== '' ? $(this).attr('data-prefix') : '',
						suffix       : $(this).attr('data-suffix') !== '' ? $(this).attr('data-suffix') : ''
					},
					counter = new CountUp( $(this).attr('id') , $(this).attr('data-start-val'), $(this).attr('data-end-val'), $(this).attr('data-decimal-points'), 2.5, options);
				$(this).appear(function() {
					setTimeout(function () {
						counter.start();
					}, delay);
				});
			});
		},
		iconBox: function(){
			var $iconBox = $('.grve-box-icon.grve-advanced-hover');
			if( isMobile.any() ) {
				$iconBox.css({'visibility' : 'visible'});
				return false;
			}
			$iconBox.each(function(){
				var $that = $(this),
					$text = $that.find('p'),
					$column = $that.parents('.grve-column'),
					space = 0,
					resize = false;

				setup();
				$(window).smartresize(setup);

				function updateParams(){
					space = $text.outerHeight();
				}

				function resetIcon(){
					$that.css({ 'top' : '' });
					$text.css({ 'opacity' : 1, 'bottom' : '' });
				}

				function setup(){
					if(!resize){
						resize = true;

						resetIcon();
						updateParams();

						$column.css({ 'overflow' : 'hidden' });
						$that.css({ 'top' : space, 'visibility' : 'visible' });
						$text.css({ 'opacity' : 0, 'position' : 'relative', 'bottom' : '-120%' });

						resize = true;
					}
				}

				$column.hover(function(){
					$that.stop( true, true ).animate({
						'top' : 0
					},400, 'easeOutBack');
					$text.stop( true, true ).delay( 100 ).animate({
						'opacity' : 1,
						'bottom' : 0
					},600, 'easeOutBack');
				},function(){
					$that.stop( true, true ).animate({
						'top' : space
					},500, 'easeOutBack');
					$text.stop( true, true ).animate({
						'opacity' : 0,
						'bottom' : '-120%'
					},400, 'easeOutBack');
				});

				function resize(){
					var delay;
					window.clearTimeout(delay);
					delay = window.setTimeout(function() {
						setup();
					}, 200);
				}

			});

		},
		animAppear: function(){
			if( bodyLoader || $('body').hasClass('page-template-template-full-page') || $('body').hasClass('page-template-template-pilling-page') ){
				return;
			}
			if( isMobile.any() && !deviceAnimAppear ) {
				$('.grve-animated-item').css('opacity',1);
			} else {
				$('.grve-animated-item').each(function() {
					var $that = $(this),
						timeDelay = $that.attr('data-delay');

					if( $that.parents('.grve-clipping-animation').length ) return;

					$that.appear(function() {
						setTimeout(function () {
							$that.addClass('grve-animated');
						}, timeDelay);
					},{accX: 0, accY: -150});
				});
			}
		},
		accordionToggle: function(){
			$('.grve-accordion-wrapper.grve-action-toggle li .grve-title-wrapper').on('click', function() {

				var $that = $(this);
				$that
					.toggleClass('active')
					.next().slideToggle(350);

				var $content = $that.parent();
				if( $content.find('.grve-isotope').length ) {
					setTimeout(function(){
						GRVE.isotope.init();
					},100);
				}
				if( $content.find('.owl-carousel').length ) {
					$content.find('.owl-carousel').each(function(){
						var owl = $(this).data('owlCarousel');
						owl.onResize();
					});
				}
			});
			$('.grve-accordion-wrapper.grve-action-accordion li .grve-title-wrapper').on('click', function() {

				var $that = $(this);
				$that
					.toggleClass('active').next().slideToggle(350)
					.parent().siblings().find('.grve-title-wrapper').removeClass('active')
					.next().slideUp(350);

				var $content = $that.parent();
				if( $content.find('.grve-isotope').length ) {
					setTimeout(function(){
						GRVE.isotope.init();
					},100);
				}
				if( $content.find('.owl-carousel').length ) {
					$content.find('.owl-carousel').each(function(){
						var owl = $(this).data('owlCarousel');
						owl.onResize();
					});
				}
			});
		},
		hovers: function(){
			var $hoverItem = $('.grve-image-hover');
			if( isMobile.any() && 0 == movedo_grve_main_data.device_hover_single_tap ) {
				var touchevent = 'touchend';
				if( $hoverItem.parent().parent().hasClass('grve-carousel-item') ) {
					touchevent = 'touchstart';
				}
				$hoverItem.on(touchevent, function(e) {
					var $item = $(this);
					if ( !$item.hasClass('hover') ) {
						$item.addClass('hover');
						$hoverItem.not(this).removeClass('hover');
						e.preventDefault();
					}
				});
				$(document).on('touchstart touchend', function(e) {
					if ( !$hoverItem.is(e.target) && $hoverItem.has(e.target).length === 0 ) {
						$hoverItem.removeClass('hover');
					}
				});
			} else {
				$hoverItem.off('click');
				$hoverItem.off('mouseenter mouseleave').on('mouseenter mouseleave', function() {
					$(this).toggleClass('hover');
				});
			}
		}
	};

	// # Section Settings
	// ============================================================================= //
	GRVE.sectionSettings = {
		init: function(){

			if( !$('#grve-sidebar').length > 0 ) return;

			var section      = '#grve-content .grve-section',
				windowWidth  = $(window).width(),
				themeWidth   = $('#grve-theme-wrapper').width(),
				wrapperWidth = $('.grve-content-wrapper').width(),
				contentWidth = $('#grve-main-content').width(),
				sidebarWidth = $('#grve-sidebar').outerWidth(),
				space        = (themeWidth - wrapperWidth)/2,
				sidebarSpace = space + wrapperWidth - contentWidth;


			$(section).each(function(){
				var $section = $(this);
				if( $section.hasClass('grve-fullwidth-background') ){
					fullBg($section);
				}
				if( $section.hasClass('grve-fullwidth') ){
					fullElement($section);
				}

			});

			function fullBg( section ) {
				if( windowWidth + scrollBarWidth >= tabletPortrait ) {
					if( $('.grve-right-sidebar').length ) {
						section.css({ 'visibility': 'visible', 'padding-left':space, 'padding-right': sidebarSpace, 'margin-left': -space, 'margin-right': -sidebarSpace});
					}
					else {
						section.css({ 'visibility': 'visible', 'padding-left':sidebarSpace, 'padding-right': space, 'margin-left': -sidebarSpace, 'margin-right': -space});
					}
				} else {
					section.css({ 'visibility': 'visible', 'padding-left':'', 'padding-right': '', 'margin-left': '', 'margin-right': ''});
				}

			}

			function fullElement( section ) {
				if( windowWidth + scrollBarWidth >= tabletPortrait ) {
					if( $('.grve-right-sidebar').length ) {
						section.css({ 'visibility': 'visible', 'padding-left':0, 'padding-right': sidebarSpace, 'margin-left': -space, 'margin-right': -sidebarSpace});
					}
					else {
						section.css({ 'visibility': 'visible', 'padding-left':sidebarSpace, 'padding-right': 0, 'margin-left': -sidebarSpace, 'margin-right': -space});
					}
				} else {
					section.css({ 'visibility': 'visible', 'padding-left':'', 'padding-right': '', 'margin-left': -space, 'margin-right': -space});
				}
			}
		}
	};

	// # Isotope
	// ============================================================================= //
	GRVE.isotope = {

		init: function(){
			var $selector = $('.grve-isotope');
			if( !$selector.length ) return;
			$selector.each(function(){
				var $element = $(this);
				GRVE.isotope.settings($element);
			});

		},
		settings: function($element){
			var $container   = $element.find('.grve-isotope-container'),
				$curCategory = $element.find('.grve-current-category'),
				$isotopItem  = $container.find('.grve-isotope-item'),
				layout       = $element.data('layout') !== '' ? $element.data('layout') : 'fitRows',
				columnWidth  = $element.hasClass('grve-portfolio') ? '.grve-image-square' : '',
				dataSpinner  = $element.data('spinner'),
				gap          = $element.hasClass('grve-with-gap') && !isNaN( $element.data('gutter-size') ) ? Math.abs( $element.data('gutter-size') )/2 : 0,
				isOriginLeft = $('body').hasClass('rtl') ? false : true;

			var offset       = $element.parents('.grve-section').hasClass('grve-fullwidth') ? -(gap * 2) : gap * 2,
				windowWidth  = $(window).width() + scrollBarWidth,
				wrapperW, columns, columnW, containerW;

			if( $element.hasClass('grve-with-gap') && $element.parents('.grve-section').hasClass('grve-fullwidth') ) {
				$element.css({'padding-left' : gap*2, 'padding-right' : gap*2 });
			}

			// Add Spinner
			if( dataSpinner == 'yes' ) {
				addSpinner();
			}
			// Filters
			filter();

			var resizing = false,
				initIso  = false,
				smallDelay;

			updateParams( initIsotope );

			if( !isMobile.any() || isMobile.Android() ) {
				$(window).smartresize(updateParams);
			} else {
				$(window).on("orientationchange",function(){
					setTimeout(updateParams, 100);
				});
			}

			$('.grve-modal-popup').on( "grve_relayout_isotope", function() {
				updateParams();
			});

			function updateParams(callback){
				if( !resizing ) {
					resizing = true;
					windowWidth = $(window).width() + scrollBarWidth;
					wrapperW = $element.innerWidth() -2;
					columns = setColumns();
					columnW = ( wrapperW + offset ) / columns;
					columnW = (columnW % 1 !== 0) ? Math.ceil(columnW) : columnW;
					containerW = columnW * columns;

					itemSize();
					containerSize();
					if( callback && !initIso ) callback();

					if( initIso ) {
						window.clearTimeout(smallDelay);
						smallDelay = window.setTimeout( function(){
							// Equal Columns
							if( layout === 'fitRows' && gridEqual ) {
								gridEqualColumns();
							}
							if( $container.parents('.grve-section').hasClass('grve-custom-height') ){
								$container.parents('.grve-section').data('plugin_columnSize').reCalculate();
							}
						}, 200 );
					}

					$container.isotope('layout');
					resizing = false;
				}
			}

			function setColumns(){
				var columns = {
						largeS   : $element.data('columns-large-screen'),
						desktop  : $element.data('columns'),
						tabletL  : $element.data('columns-tablet-landscape'),
						tabletP  : $element.data('columns-tablet-portrait'),
						mobile  : $element.data('columns-mobile')
					};
				$element.removeClass('grve-isotope-column-5 grve-isotope-column-4 grve-isotope-column-3 grve-isotope-column-2 grve-isotope-column-1');
				if ( windowWidth > largeScreen ) {
					columns = columns.largeS;
				} else if ( windowWidth > tabletLandscape && windowWidth <= largeScreen ) {
					columns = columns.desktop;
				} else if ( windowWidth > tabletPortrait && windowWidth <= tabletLandscape ) {
					columns = columns.tabletL;
				} else if ( windowWidth > mobileScreen && windowWidth <= tabletPortrait ) {
					columns = columns.tabletP;
				} else {
					columns = columns.mobile;
				}

				$element.addClass('grve-isotope-column-' + columns);
				return columns;
			}

			function itemSize(){

				$isotopItem.css({ 'padding-left' : gap, 'padding-right' : gap, 'margin-bottom' : gap * 2, 'width' : columnW });
				// Item Width * 2
				if( columns != 1 ) {
					$container.find('.grve-image-landscape').css({ 'width': columnW * 2 }).find('.grve-media').css({ 'height': columnW - ( gap * 2 ) });
					$container.find('.grve-image-portrait').css({ 'width': columnW }).find('.grve-media').css({ 'height': ( columnW * 2 ) - ( gap * 2 ) });
				}

				// Item Column 2
				if( columns == 2 ) {
					if( windowWidth > mobileScreen ){
						$container.find('.grve-image-landscape').css({ 'width': columnW  }).find('.grve-media').css({ 'height': ( columnW / 2 ) - ( gap * 2 ) });
					} else {
						$container.find('.grve-image-landscape').css({ 'width': columnW  }).find('.grve-media').css({ 'height': columnW - ( gap * 2 ) });
					}
				}

				// Item Column 1
				if( columns == 1 ) {
					$container.find('.grve-image-landscape').css({ 'width': columnW  }).find('.grve-media').css({ 'height': '' });
					$container.find('.grve-image-portrait').css({ 'width': columnW }).find('.grve-media').css({ 'height': '' });
				}
			}

			function containerSize(){
				$container.css({'margin-left' : - gap, 'margin-right' : - gap, 'width' : containerW });
			}

			function initIsotope(){
				$container.isotope({
					itemSelector: '.grve-isotope-item',
					stamp: '.grve-isotope-stamp-item',
					layoutMode: layout,
					animationEngine : 'jquery',
					masonry: {
						columnWidth: columnWidth
					},
					resize: false,
					isOriginLeft: isOriginLeft
				});
				// layout Isotope after each image loads
				$container.imagesLoaded('always',function(){
					$container.isotope('layout');
					// Spinner
					var dataSpinner = $container.parent().data('spinner');
					if( dataSpinner == 'yes' ) {
						setTimeout(function() {
							removeSpinner();
						},2000);
					} else {
						$container.css({'opacity': 1});
						// Isotope Animation
						if( !isMobile.any() ){
							animation($container);
						} else {
							$container.find('.grve-isotope-item-inner').addClass('grve-animated');
						}
					}
				});

				initIso = true;
			}

			function addSpinner(){
				var $spinner = $('<div class="grve-spinner"></div>');
				$spinner.appendTo( $element );
			}

			function removeSpinner(){
				$element.find('.grve-spinner').fadeOut(600,function(){
					$container.css({'opacity': 1});
					animation();
				});
			}

			function animation(){
				var cnt = 1,
					itemAppeared = 1;
				$isotopItem.appear(function() {
					var $this = $(this),
						delay = 200 * cnt++;

					setTimeout(function () {
						itemAppeared++;
						if( itemAppeared == cnt ){
							cnt = 1;
						}
						$this.find('.grve-isotope-item-inner').addClass('grve-animated');
					}, delay);
				});
			}

			function filter(){
				$element.find('.grve-filter li').on('click', function() {
					var $filter      = $(this),
						selector     = $filter.attr('data-filter'),
						gototop      = $filter.parents('.grve-filter').attr('data-gototop') == 'no' ? false : true,
						title        = $filter.html(),
						$curCategory = $element.find('.grve-current-category');

					if( $curCategory.length > 0 ){
						$curCategory.find('span').html( title );
					}

					$container.isotope({
						filter: selector
					});

					// Go tot top
					if( gototop ) {
						GRVE.pageSettings.linkGoToTop( $filter.parent(), 300, 30 );
					}

					$(this).addClass('selected').siblings().removeClass('selected');
				});
			}

			function gridEqualColumns(){
				var $elContent = $container.find('.grve-blog-item-inner'),
					heightArr = [],
					columnMaxH = 0;

				// Reset Height
				$container.find('.grve-isotope-item .grve-post-content').css('height','auto');
				$container.find('.grve-isotope-item .grve-blog-item-inner').css('height','auto');
				$container.find('.grve-isotope-item .grve-post-meta-wrapper').removeClass('grve-bottom');

				$elContent.each(function(){
					var $that = $(this),
						height = $that.outerHeight();
					heightArr.push( height );
				});

				columnMaxH = heightArr.length > 0 ? Math.max.apply(Math, heightArr) : 0;

				$container.find('.grve-isotope-item .grve-blog-item-inner').css('height',columnMaxH);
				$container.find('.grve-isotope-item .grve-post-meta-wrapper').addClass('grve-bottom');
				$container.find('.grve-isotope-item.grve-style-2').addClass('grve-middle');

				$container.isotope('layout');
			}
		},
		noIsoFilters: function() {
			var $selector = $('.grve-non-isotope');
			$selector.each(function(){
				var $that = $(this);
				$that.find('.grve-filter li').on('click', function() {
					var selector = $(this).attr('data-filter');
					if ( '*' == selector ) {
						$that.find('.grve-non-isotope-item').fadeIn('1000');
					} else {
						$that.find('.grve-non-isotope-item').hide();
						$that.find(selector).fadeIn('1000');
					}
					$(this).addClass('selected').siblings().removeClass('selected');
				});
			});
		}
	};

	// # Scroll Direction
	// ============================================================================= //
	GRVE.scrollDir = {
		init: function(){
			var scroll = $(window).scrollTop();
			if (scroll > lastScrollTop){
				lastScrollTop = scroll;
				return { direction : 'scrollDown'  };
			} else {
				lastScrollTop = scroll;
				return { direction : 'scrollUp'  };
			}

			lastScrollTop = scroll;
		}
	};

	// # Global Variables
	// ============================================================================= //
	var bodyLoader = false;
	var largeScreen = 2048;
	var tabletLandscape = 1200;
	var tabletPortrait = 1023;
	var mobileScreen = 767;
	var lastScrollTop = 0;
	var wpBarHeight = $('#grve-body').hasClass('admin-bar') ? 32 : 0;
	var $videoBg = $('.grve-bg-video');
	var isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
		BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
		iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
		Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
		Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
		any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};

	// Animation support & prefixing
	var t = document.body || document.documentElement;
	var s = t.style;
	var tSupport = s.transition !== undefined || s.WebkitTransition !== undefined || s.MozTransition !== undefined || s.MsTransition !== undefined || s.OTransition !== undefined;
	var property = [ 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform' ];
	var prefix;
	for( var i in property ){
		if( s[ property[ i ] ] !== undefined ){
			prefix = '-' + property[ i ].replace( 'Transform', '' ).toLowerCase();
		}
	}
	var transform = prefix + '-transform';

	// # Scrollbar Width
	// ============================================================================= //
	var parent, child, scrollBarWidth;

	if( scrollBarWidth === undefined ) {
		parent          = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
		child           = parent.children();
		scrollBarWidth  = child.innerWidth()-child.height(99).innerWidth();
		parent.remove();
	}

	$(document).ready(function(){ GRVE.documentReady.init(); });
	$(window).smartresize(function(){ GRVE.documentResize.init(); });
	$(window).on('load',function () { GRVE.documentLoad.init(); });
	$(window).on('scroll', function() { GRVE.documentScroll.init(); });

})(jQuery);