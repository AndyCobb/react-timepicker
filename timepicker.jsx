/** @jsx React.DOM */

// A field that delays calling its onChange property until it's blurred or the
// user presses enter.  After it's blurred, it resets its value back to its
// given prop value.
var DelayedField = React.createClass({
  getInitialState: function() {
    return {
      currentValue: this.props.value,
      focused:      false
    };
  },

  componentWillReceiveProps: function(nextProps) {
    if (!this.state.focused) {
      this.setState({
        currentValue: nextProps.value
      });
    }
  },

  handleChange: function(e) {
    this.setState({
      currentValue: e.target.value
    });
  },

  handleKeyUp: function(e) {
    if (e.keyCode === 13) {
      this.getDOMNode().blur();
      this.handleBlur();
    }
  },

  handleFocus: function() {
    this.setState({
      focused: true
    });
  },

  handleBlur: function() {
    var currentValue = this.state.currentValue;

    this.setState({
      currentValue: this.props.value,
      focused:      false
    });

    if (this.props.onChange) {
      this.props.onChange({target: {value: currentValue} });
    }
  },

  render: function() {
    return <input {...this.props} onChange={this.handleChange} value={this.state.currentValue} onBlur={this.handleBlur} onKeyUp={this.handleKeyUp}/>;
  }
});

var TimePicker = React.createClass({
  statics: {
    // Convert a Date object (ex. new Date()) and convert it to
    // a time object.
    fromDate: function(d) {
      var h   = d.getHours(),
          m   = d.getMinutes();

      return TimePicker.stringify({
        hour: h % 12,
        minute: m,
        meridian: h > 12 ? 'PM' : 'AM'
      });
    },

    // Convert a time object to an integer number of minutes.
    toMinutes: function(d) {
      var hour = d.hour % 12,
          minute = d.minute,
          meridian = d.meridian;

      return hour*60 + minute + (meridian === 'PM' ? 12*60 : 0);
    },

    // Convert an integer number of minutes to a time object.
    fromMinutes: function(m) {
      var hour, minute, meridian;

      while (m < 0) {
        m += 24*60;
      }

      m = m % (24*60);

      if (m >= 12*60) {
        m        -= 12*60;
        meridian  = 'PM';
      } else {
        meridian = 'AM';
      }

      hour   = (m / 60)|0;
      minute = m % 60;

      if (hour === 0) {
        hour = 12;
      }

      return {hour: hour, minute: minute, meridian: meridian};
    },

    // Convert a time object to a string.
    stringify: function(d) {
      var m = d.minute;

      if (m < 10) {
        m = '0' + m;
      }

      return d.hour + ':' + m + ' ' + d.meridian;
    },

    // Parse a string into a time object, or return null if it's invalid.
    parse: function(s) {
      var parsed = s.match(/(\d+):(\d+)\s*(\w+)?/);

      if (parsed) {
        var hour     = +parsed[1],
            minute   = +parsed[2],
            meridian = parsed[3];

        if (isNaN(hour))   hour   = 12;
        if (isNaN(minute)) minute = 0;
        if (hour > 12)     hour   = 12;
        if (minute > 59)   minute = 59;
        
        switch (meridian && meridian.toLowerCase()) {
        default:
        case 'am':
          meridian = 'AM';
        break;
        case 'pm':
          meridian = 'PM';
        break;
        }

        return {
          hour: hour,
          minute: minute,
          meridian: meridian
        };
      }

      return null;
    }
  },

  componentDidMount: function() {
    // Only clicks that were clicked outside of the modal will reach here,
    // because of cancelClick.
    window.addEventListener('click', function(e) {
      this.setState({
        showModal: false
      });
    }.bind(this));
  },

  cancelClick: function(e) {
    // See componentDidMount.
    e.stopPropagation();
  },

  getInitialState: function() {
    return {
      showModal: false
    };
  },

  handleChange: function(e) {
    var parsed = TimePicker.parse(e.target.value);

    if (parsed) {
      this.props.onChange({ value: TimePicker.stringify(parsed) });
    }
  },

  normalize: function(s) {
    var parsed = TimePicker.parse(s);

    return parsed && TimePicker.stringify(parsed);
  },

  toggleModal: function() {
    this.setState({
      showModal: !this.state.showModal
    });
  },

  renderModal: function() {
    if (this.state.showModal) {
      var input   = this.refs.timepicker.getDOMNode(),
          x       = input.offsetLeft,
          y       = input.offsetTop + input.offsetHeight,
          parsed  = TimePicker.parse(this.props.value),
          minutes = TimePicker.toMinutes(parsed);

      var tdstyle = {
        'text-align': 'center',
        'vertical-align': 'middle',
        'cursor': 'pointer',
        '-webkit-touch-callout': 'none',
        '-webkit-user-select': 'none',
        '-khtml-user-select': 'none',
        '-moz-user-select': 'moz-none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      };

      var change = function(amount) {
        return function() {
          if (this.props.onChange) {
            this.props.onChange({ value: TimePicker.stringify(TimePicker.fromMinutes(minutes + amount)) });
          }
        }.bind(this);
      }.bind(this);

      var changeHour = function(e) {
        var h = +e.target.value;
        if (!isNaN(h) && h >= 1 && h <= 12) {
          this.props.onChange({ value: TimePicker.stringify({ hour: h, minute: parsed.minute, meridian: parsed.meridian }) });
        }
      }.bind(this);
      var changeMinute = function(e) {
        var m = +e.target.value;
        if (!isNaN(m) && m >= 0 && m <= 59) {
          this.props.onChange({ value: TimePicker.stringify({ hour: parsed.hour, minute: m, meridian: parsed.meridian }) });
        }
      }.bind(this);
      var changeMeridian = function(e) {
        var meridian = e.target.value.toLowerCase();
        if (meridian == 'am' || meridian == 'pm') {
          this.props.onChange({ value: TimePicker.stringify({ hour: parsed.hour, minute: parsed.minute, meridian: e.target.value }) });
        }
      }.bind(this);

      return <div style={{left: x, top: y, position: 'absolute', display: 'block', padding: 5}} className="dropdown-menu">
        <table>
          <tr>
            <td style={tdstyle} onClick={change(+60)}><i className="glyphicon glyphicon-chevron-up"/></td>
            <td/>
            <td style={tdstyle} onClick={change(+15)}><i className="glyphicon glyphicon-chevron-up"/></td>
            <td/>
            <td style={tdstyle} onClick={change(+12*60)}><i className="glyphicon glyphicon-chevron-up"/></td>
          </tr>
          <tr>
            <td><DelayedField className="form-control" style={{width: 45, 'text-align': 'right'}} type="text" value={parsed.hour} onChange={changeHour}/></td>
            <td style={{padding: 10, 'text-align': 'center'}}>:</td>
            <td><DelayedField className="form-control" style={{width: 45, 'text-align': 'right'}} type="text" value={('0' + parsed.minute).slice(-2)} onChange={changeMinute}/></td>
            <td style={{padding: 10}}></td>
            <td><DelayedField className="form-control" size="2" type="text" value={parsed.meridian} onChange={changeMeridian}/></td>
          </tr>
          <tr>
            <td style={tdstyle} onClick={change(-60)}><i className="glyphicon glyphicon-chevron-down"/></td>
            <td/>
            <td style={tdstyle} onClick={change(-15)}><i className="glyphicon glyphicon-chevron-down"/></td>
            <td/>
            <td style={tdstyle} onClick={change(-12*60)}><i className="glyphicon glyphicon-chevron-down"/></td>
          </tr>
        </table>
      </div>;
    }
  },

  render: function() {
    return <div onClick={this.cancelClick}>
      <div className="input-group" style={{width: 150}}>
        <DelayedField ref="timepicker" type="text" onChange={this.handleChange} value={this.props.value} normalize={this.normalize} className="form-control"/>
        <span className="input-group-btn">
          <button className="btn btn-default" type="button" onClick={this.toggleModal}><i className="glyphicon glyphicon-time"/></button>
        </span>
      </div>
      {this.renderModal()}
    </div>;
  }
});
