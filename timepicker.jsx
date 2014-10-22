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

// Modulo that handles negative numbers.
function mod(n, m) {
  var i = 0;

  while (n + i*m < 0) {
    i += 1;
  }

  while (n + i*m >= m) {
    i -= 1;
  }

  return n + i*m;
}

var TimePicker = React.createClass({
  statics: {
    // Convert a Date object to an integer number of minutes.
    fromDate: function(d) {
      return d.getHours() * 60 + d.getMinutes();
    },

    // Convert an integer number of minutes into three strings:
    // hours, minutes, meridian.
    stringifyPieces: function(m) {
      var hour, minute, meridian;

      m = mod(m, 24*60);

      if (m >= 12*60) {
        m -= 12*60;
        meridian = 'PM';
      } else {
        meridian = 'AM';
      }

      hour   = (m / 60)|0;
      minute = m % 60;

      if (hour === 0) {
        hour = 12;
      }

      if (minute < 10) {
        minute = '0' + minute;
      }

      return [hour, minute, meridian];
    },

    // Convert an integer number of minutes to a time string.
    stringify: function(m) {
      var pieces = TimePicker.stringifyPieces(m);

      return pieces[0] + ':' + pieces[1] + ' ' + pieces[2];
    },

    // Parse a string into an integer number of minutes, or return null if
    // it's invalid.
    parse: function(s) {
      var parsed = s.match(/(\d+)\s*:\s*(\d+)\s*(\w+)?/);

      if (parsed) {
        var hour     = +parsed[1],
            minute   = +parsed[2],
            meridian = parsed[3],
            result   = 0;

        if (isNaN(hour) || hour > 12 || isNaN(minute) || minute > 59) {
          return null;
        }

        if (hour === 12) {
          hour = 0;
        }
        
        switch (meridian && meridian.toLowerCase()) {
        case 'am':
        break;
        case 'pm':
          result += 12*60;
        break;
        default:
          return null;
        }

        result += hour*60;
        result += minute;

        return result;
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
          minutes = TimePicker.parse(this.props.value),
          pieces  = TimePicker.stringifyPieces(minutes),
          self    = this;

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
          if (self.props.onChange) {
            self.props.onChange({ value: TimePicker.stringify(minutes + amount) });
          }
        };
      };

      var changeHour = function(e) {
        var value = TimePicker.stringify(TimePicker.parse(e.target.value + ':' + pieces[1] + ' ' + pieces[2]));
        self.props.onChange({ value: value });
      };
      var changeMinute = function(e) {
        var value = TimePicker.stringify(TimePicker.parse(pieces[0] + ':' + e.target.value + ' ' + pieces[2]));
        self.props.onChange({ value: value });
      };
      var changeMeridian = function(e) {
        var value = TimePicker.stringify(TimePicker.parse(pieces[0] + ':' + pieces[1] + ' ' + e.target.value));
        self.props.onChange({ value: value });
      };

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
            <td><DelayedField className="form-control" style={{width: 45, 'text-align': 'right'}} type="text" value={pieces[0]} onChange={changeHour}/></td>
            <td style={{padding: 10, 'text-align': 'center'}}>:</td>
            <td><DelayedField className="form-control" style={{width: 45, 'text-align': 'right'}} type="text" value={pieces[1]} onChange={changeMinute}/></td>
            <td style={{padding: 10}}></td>
            <td><DelayedField className="form-control" size="2" type="text" value={pieces[2]} onChange={changeMeridian}/></td>
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
    var displayValue = TimePicker.stringify(TimePicker.parse(this.props.value));

    return <div onClick={this.cancelClick}>
      <div className="input-group" style={{width: 150}}>
        <DelayedField ref="timepicker" type="text" onChange={this.handleChange} value={displayValue} normalize={this.normalize} className="form-control"/>
        <span className="input-group-btn">
          <button className="btn btn-default" type="button" onClick={this.toggleModal}><i className="glyphicon glyphicon-time"/></button>
        </span>
      </div>
      {this.renderModal()}
    </div>;
  }
});
