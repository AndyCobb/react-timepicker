
all: timepicker.js timepicker.js.min

timepicker.js: timepicker.jsx
	jsx <$^ >$@

timepicker.js.min: timepicker.js
	uglifyjs --preamble "/* From github.com/balihoo-acobb/react-timepicker */" <$^ >$@

