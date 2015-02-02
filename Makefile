
all: react-timepicker.js react-timepicker.min.js

react-timepicker.js: timepicker.jsx
	jsx <$^ >$@

react-timepicker.min.js: react-timepicker.js
	uglifyjs --preamble "/* From github.com/balihoo-acobb/react-timepicker */" <$^ >$@

