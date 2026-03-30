module github.com/labhacker007/Test-Code/test/test-scanner

go 1.23

replace github.com/labhacker007/Test-Code/agent => ../../agent

require github.com/labhacker007/Test-Code/agent v0.0.0

require (
	github.com/fsnotify/fsnotify v1.8.0 // indirect
	github.com/google/uuid v1.6.0 // indirect
	golang.org/x/sys v0.13.0 // indirect
)
