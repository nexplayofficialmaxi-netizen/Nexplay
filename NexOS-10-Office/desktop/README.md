# NexOS desktop integration boundary

This directory is reserved for the NexOS graphical shell and its XDG/Openbox integration. The current repository root contains the NexPlay React/Vite website, not a distinct NexOS desktop prototype; that application is intentionally not copied, modified, or started as the OS shell. If the desktop prototype exists on another branch or location, identify it before integration.

Initial boot stage uses Debian's Openbox session so the live image can be tested independently. Later, integrate the NexOS web desktop as a separately built, local shell application after checking its memory footprint and verifying that it can start offline. Do not promise 500 MB until measured on target hardware.
