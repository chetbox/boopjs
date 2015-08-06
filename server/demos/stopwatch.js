// Reset the timer
tap('reset');

// Tap the start button
tap('start');

// Stop after 3 seconds
wait(3);
tap('stop');

// Take a screenshot
screenshot();

// Check that 3 seconds have been counted
if (text({id: 'seconds'}) !== '03') {
    throw 'Expected 3 seconds counted';
}
