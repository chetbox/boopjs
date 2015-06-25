/*
 * Stopwatch automation demo
 */


// Gets the ID of the text view denoting seconds
__('00').closest_to('secs').id();

// Reset the timer
__('reset').tap();

// Tap the start button
__('start').tap();

// Stop after 3 seconds
wait(3);
__('stop').tap();
