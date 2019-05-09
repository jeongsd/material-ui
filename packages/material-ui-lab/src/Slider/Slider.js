import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { fade, withStyles } from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import { useForkRef } from '@material-ui/core/utils';
import { clamp } from '@material-ui/lab/utils';

export const styles = theme => {
  const commonTransitionsOptions = {
    duration: theme.transitions.duration.shortest,
    easing: theme.transitions.easing.easeOut,
  };

  const trackTransitions = theme.transitions.create(
    ['width', 'height', 'transform'],
    commonTransitionsOptions,
  );
  const thumbTransitions = theme.transitions.create(
    ['transform', 'box-shadow'],
    commonTransitionsOptions,
  );

  const colors = {
    primary: theme.palette.primary.main,
    disabled: theme.palette.grey[400],
    thumbOutline: fade(theme.palette.primary.main, 0.16),
  };

  /**
   * radius of the box-shadow when pressed
   * hover should have a diameter equal to the pressed radius
   */
  const pressedOutlineRadius = 9;

  /**
   * We need to give some overflow so that the button and tap
   * highlight can be shown with overlay hidden.
   */
  const overflowSize = 24;

  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
      width: '100%',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
      '&$disabled': {
        cursor: 'no-drop',
      },
      '&$vertical': {
        height: '100%',
      },
    },
    /* Styles applied to the container element. */
    container: {
      width: `calc(100% + ${overflowSize * 2}px)`,
      overflow: 'hidden',
      padding: overflowSize,
      margin: -overflowSize,
      boxSizing: 'border-box',
      '&$vertical': {
        height: `calc(100% + ${overflowSize * 2}px)`,
      },
    },
    /* Styles applied to the track elements. */
    track: {
      position: 'absolute',
      transform: 'translate(0, -50%)',
      top: '50%',
      width: '100%',
      height: 2,
      backgroundColor: colors.primary,
      transition: trackTransitions,
      '&$activated': {
        transition: 'none',
      },
      '&$disabled': {
        backgroundColor: colors.disabled,
        boxShadow: 'none',
      },
      '&$vertical': {
        transform: 'translate(-50%, 0)',
        left: '50%',
        top: 'initial',
        bottom: 0,
        width: 2,
        height: '100%',
      },
    },
    /* Styles applied to the track element before the thumb. */
    trackBefore: {
      zIndex: 1,
      left: 0,
      transformOrigin: 'left bottom',
    },
    /* Styles applied to the track element after the thumb. */
    trackAfter: {
      right: 0,
      opacity: 0.24,
      transformOrigin: 'right top',
      '&$vertical': {
        top: 0,
      },
    },
    /* Styles applied to the thumb wrapper element. */
    thumbWrapper: {
      position: 'relative',
      zIndex: 2,
      transition: thumbTransitions,
      '&$activated': {
        transition: 'none',
      },
      '&$vertical': {
        bottom: 0,
        height: '100%',
      },
    },
    /* Styles applied to the thumb element. */
    thumb: {
      // Opt out of rtl flip as positioning here only is for centering
      flip: false,
      position: 'absolute',
      left: 0,
      transform: 'translate(-50%, -50%)',
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: colors.primary,
      transition: thumbTransitions,
      '&$focused, &:hover': {
        boxShadow: `0px 0px 0px ${pressedOutlineRadius}px ${colors.thumbOutline}`,
      },
      '&$activated': {
        boxShadow: `0px 0px 0px ${pressedOutlineRadius * 2}px ${colors.thumbOutline}`,
      },
      '&$disabled': {
        cursor: 'no-drop',
        width: 9,
        height: 9,
        backgroundColor: colors.disabled,
      },
      '&$jumped': {
        boxShadow: `0px 0px 0px ${pressedOutlineRadius * 2}px ${colors.thumbOutline}`,
      },
    },
    /* Class applied to the thumb element if custom thumb icon provided. */
    thumbIconWrapper: {
      backgroundColor: 'transparent',
    },
    thumbIcon: {
      height: 'inherit',
      width: 'inherit',
    },
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `disabled`. */
    disabled: {},
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `jumped`. */
    jumped: {},
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `focused`. */
    focused: {},
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `activated`. */
    activated: {},
    /* Class applied to the root, track and container to trigger JSS nested styles if `vertical`. */
    vertical: {},
  };
};

function percentToValue(percent, min, max) {
  return ((max - min) * percent) / 100 + min;
}

function roundToStep(number, step) {
  return Math.round(number / step) * step;
}

function getOffset(node) {
  const { pageYOffset, pageXOffset } = global;
  const { left, bottom } = node.getBoundingClientRect();

  return {
    bottom: bottom + pageYOffset,
    left: left + pageXOffset,
  };
}

function getMousePosition(event, touchId) {
  if (event.changedTouches) {
    // event.changedTouches.findIndex(touch => touch.identifier === touchId)
    let touchIndex = 0;
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const touch = event.changedTouches[i];
      if (touch.identifier === touchId) {
        touchIndex = i;
        break;
      }
    }

    if (event.changedTouches[touchIndex]) {
      return {
        x: event.changedTouches[touchIndex].pageX,
        y: event.changedTouches[touchIndex].pageY,
      };
    }
  }

  return {
    x: event.pageX,
    y: event.pageY,
  };
}

function calculatePercent(node, event, isVertical, isRtl, touchId) {
  const { width, height } = node.getBoundingClientRect();
  const { bottom, left } = getOffset(node);
  const { x, y } = getMousePosition(event, touchId);

  const value = isVertical ? bottom - y : x - left;
  const onePercent = (isVertical ? height : width) / 100;

  return isRtl && !isVertical ? 100 - clamp(value / onePercent) : clamp(value / onePercent);
}

function preventPageScrolling(event) {
  event.preventDefault();
}

/**
 * @param {number} rawValue
 * @param {object} props
 */
export function defaultValueReducer(rawValue, props) {
  const { disabled, step } = props;

  if (disabled) {
    return null;
  }

  if (step) {
    return roundToStep(rawValue, step);
  }

  return Number(rawValue.toFixed(3));
}

const Slider = React.forwardRef(function Slider(props, ref) {
  const {
    className: classNameProp,
    classes,
    component: Component,
    thumb: thumbIcon,
    disabled,
    max,
    min,
    onChange,
    onDragEnd,
    onDragStart,
    step,
    theme,
    value,
    valueReducer,
    vertical,
    ...other
  } = props;

  const [currentState, setCurrentState] = React.useState('initial')
  const touchId = React.useRef();
  const jumpAnimationTimeoutId = React.useRef(-1);

  const containerRef = React.useRef();
  const handleOwnRef = React.useCallback(newRef => {
    // #StrictMode ready
    const nextContainer = ReactDOM.findDOMNode(newRef);
    const prevContainer = containerRef.current;

    if (prevContainer !== nextContainer) {
      if (prevContainer) {
        prevContainer.removeEventListener('touchstart', preventPageScrolling, {
          passive: false,
        });
      }
      if (nextContainer) {
        nextContainer.addEventListener('touchstart', preventPageScrolling, { passive: false });
      }
    }

    containerRef.current = nextContainer;
  }, []);
  const handleRef = useForkRef(ref, handleOwnRef);

  React.useEffect(() => {
    if (disabled) {
      setCurrentState('disabled');
    }

    if (!disabled && currentState === 'disabled') {
      setCurrentState('normal');
    }
  }, [currentState, disabled]);

  React.useEffect(() => {
    if (currentState === 'jumped') {
      clearTimeout(jumpAnimationTimeoutId.current);
      jumpAnimationTimeoutId.current = setTimeout(() => {
        setCurrentState('normal');
      }, theme.transitions.duration.complex);
    }
    return () => {
      clearTimeout(jumpAnimationTimeoutId.current);
    };
  }, [currentState, theme.transitions.duration.complex]);

  const isReverted = () => {
    return theme.direction === 'rtl';
  }

  const calculateValueFromPercent = (event) => {
    const percent = calculatePercent(
      containerRef.current,
      event,
      vertical,
      isReverted(),
      touchId.current,
    );
    return percentToValue(percent, min, max);
  }

  const playJumpAnimation = () => {
    setCurrentState('jumped');
  }

  const emitChange = (event, rawValue, callback) => {
    const newValue = valueReducer(rawValue, props, event);

    if (newValue !== null && newValue !== value && typeof onChange === 'function') {
      onChange(event, newValue);

      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  const handleDragEnd = (event) => {
    const newValue = calculateValueFromPercent(event);
    const reducedValue = valueReducer(newValue, props, event);

    setCurrentState('normal');
    /* eslint-disable no-use-before-define */
    document.body.removeEventListener('mouseenter', handleMouseEnter);
    document.body.removeEventListener('mouseleave', handleMouseLeave);
    document.body.removeEventListener('mousemove', handleMouseMove);
    document.body.removeEventListener('mouseup', handleMouseUp);
    document.body.removeEventListener('touchend', handleTouchEnd);
    /* eslint-enable no-use-before-define */
    if (typeof onDragEnd === 'function') {
      onDragEnd(event, reducedValue);
    }
  }

  const handleMouseUp = event => {
    handleDragEnd(event);
  };

  const handleMouseMove = event => {
    const newValue = calculateValueFromPercent(event);

    emitChange(event, newValue);
  };

  const handleKeyDown = event => {
    const onePercent = Math.abs((max - min) / 100);
    const stepOrOnePercent = step || onePercent;
    let newValue;

    switch (event.key) {
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      case 'PageUp':
        newValue = value + onePercent * 10;
        break;
      case 'PageDown':
        newValue = value - onePercent * 10;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = value + stepOrOnePercent;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = value - stepOrOnePercent;
        break;
      default:
        return;
    }

    event.preventDefault();

    newValue = clamp(newValue, min, max);

    emitChange(event, newValue);
  };

  const handleFocus = () => {
    setCurrentState('focused')
  }

  const handleBlur = () => {
    setCurrentState('normal')
  }

  const handleClick = event => {
    const newValue = calculateValueFromPercent(event);

    emitChange(event, newValue, () => {
      playJumpAnimation();
    });
  };

  const handleMouseEnter = event => {
    // If the slider was being interacted with but the mouse went off the window
    // and then re-entered while unclicked then end the interaction.
    if (event.buttons === 0) {
      handleDragEnd(event);
    }
  };

  const handleMouseLeave = event => {
    // The mouse will have moved between the last mouse move event
    // this mouse leave event
    handleMouseMove(event);
  };

  const handleMouseDown = event => {
    setCurrentState('activated');

    const newValue = calculateValueFromPercent(event);
    const reducedValue = valueReducer(newValue, props, event);

    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseup', handleMouseUp);

    if (typeof onDragStart === 'function') {
      onDragStart(event, reducedValue);
    }
  };

  const handleTouchEnd = event => {
    if (touchId.current === undefined) {
      handleMouseUp(event);
    }

    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const touch = event.changedTouches.item(i);
      if (touch.identifier === touchId.current) {
        handleMouseUp(event);
        break;
      }
    }
  };

  const handleTouchStart = event => {
    event.preventDefault();
    const touch = event.changedTouches.item(0);
    if (touch != null) {
      touchId.current = touch.identifier;
    }
    setCurrentState('activated');

    const newValue = calculateValueFromPercent(event);
    const reducedValue = valueReducer(newValue, props, event);
    emitChange(event, newValue);

    document.body.addEventListener('touchend', handleTouchEnd);

    if (typeof onDragStart === 'function') {
      onDragStart(event, reducedValue);
    }
  };

  const handleTouchMove = event => {
    if (touchId.current === undefined) {
      handleMouseMove(event);
    }

    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const touch = event.changedTouches.item(i);
      if (touch.identifier === touchId.current) {
        handleMouseMove(event);
        break;
      }
    }
  };

  const calculateTrackPartStyles = (percent) => {
    switch (currentState) {
      case 'disabled':
        return {
          [vertical ? 'height' : 'width']: `calc(${percent}% - 6px)`,
        };
      default:
        return {
          transform: `${
            vertical
              ? `translateX(${theme.direction === 'rtl' ? '' : '-'}50%) scaleY`
              : 'translateY(-50%) scaleX'
          }(${percent / 100})`,
        };
    }
  }

  React.useEffect(() => {
    return () => {
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const percent = clamp(((value - min) * 100) / (max - min));

  const commonClasses = {
    [classes.disabled]: disabled,
    [classes.jumped]: !disabled && currentState === 'jumped',
    [classes.focused]: !disabled && currentState === 'focused',
    [classes.activated]: !disabled && currentState === 'activated',
    [classes.vertical]: vertical,
    [classes.rtl]: theme.direction === 'rtl',
  };

  const className = clsx(
    classes.root,
    {
      [classes.vertical]: vertical,
      [classes.disabled]: disabled,
    },
    classNameProp,
  );

  const containerClasses = clsx(classes.container, {
    [classes.vertical]: vertical,
  });

  const trackBeforeClasses = clsx(classes.track, classes.trackBefore, commonClasses);
  const trackAfterClasses = clsx(classes.track, classes.trackAfter, commonClasses);

  const thumbTransformFunction = vertical ? 'translateY' : 'translateX';
  const thumbDirectionInverted = vertical || theme.direction === 'rtl';
  const inlineTrackBeforeStyles = calculateTrackPartStyles(percent);
  const inlineTrackAfterStyles = calculateTrackPartStyles(100 - percent);
  const inlineThumbStyles = {
    transform: `${thumbTransformFunction}(${thumbDirectionInverted ? 100 - percent : percent}%)`,
  };

  /** Start Thumb Icon Logic Here */
  const ThumbIcon = thumbIcon
    ? React.cloneElement(thumbIcon, {
        ...thumbIcon.props,
        className: clsx(thumbIcon.props.className, classes.thumbIcon),
      })
    : null;
  /** End Thumb Icon Logic Here */

  const thumbWrapperClasses = clsx(classes.thumbWrapper, commonClasses);
  const thumbClasses = clsx(
    classes.thumb,
    {
      [classes.thumbIconWrapper]: thumbIcon,
    },
    commonClasses,
  );

  return (
    <Component
      className={className}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStartCapture={handleTouchStart}
      onTouchMove={handleTouchMove}
      ref={handleRef}
      {...other}
    >
      <div className={containerClasses}>
        <div className={trackBeforeClasses} style={inlineTrackBeforeStyles} />
        <div className={thumbWrapperClasses} style={inlineThumbStyles}>
          <ButtonBase
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-orientation={vertical ? 'vertical' : 'horizontal'}
            className={thumbClasses}
            disabled={disabled}
            disableRipple
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onTouchStartCapture={handleTouchStart}
            onTouchMove={handleTouchMove}
            onFocusVisible={handleFocus}
            role="slider"
          >
            {ThumbIcon}
          </ButtonBase>
        </div>
        <div className={trackAfterClasses} style={inlineTrackAfterStyles} />
      </div>
    </Component>
  );
})


Slider.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: PropTypes.elementType,
  /**
   * If `true`, the slider will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * The maximum allowed value of the slider.
   * Should not be equal to min.
   */
  max: PropTypes.number,
  /**
   * The minimum allowed value of the slider.
   * Should not be equal to max.
   */
  min: PropTypes.number,
  /**
   * Callback function that is fired when the slider's value changed.
   */
  onChange: PropTypes.func,
  /**
   * Callback function that is fired when the slide has stopped moving.
   */
  onDragEnd: PropTypes.func,
  /**
   * Callback function that is fired when the slider has begun to move.
   */
  onDragStart: PropTypes.func,
  /**
   * The granularity the slider can step through values.
   */
  step: PropTypes.number,
  /**
   * @ignore
   */
  theme: PropTypes.object.isRequired,
  /**
   * The component used for the slider icon.
   * This is optional, if provided should be a react element.
   */
  thumb: PropTypes.element,
  /**
   * The value of the slider.
   */
  value: PropTypes.number.isRequired,
  /**
   * the reducer used to process the value emitted from the slider. If `null` or
   * the same value is returned no change is emitted.
   * @param {number} rawValue - value in [min, max]
   * @param {SliderProps} props - current props of the Slider
   * @param {Event} event - the event the change was triggered from
   */
  valueReducer: PropTypes.func,
  /**
   * If `true`, the slider will be vertical.
   */
  vertical: PropTypes.bool,
};

Slider.defaultProps = {
  min: 0,
  max: 100,
  component: 'div',
  valueReducer: defaultValueReducer,
};

export default withStyles(styles, { name: 'MuiSlider', withTheme: true })(Slider);
