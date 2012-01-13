var zombie = require("zombie");
var assert = require("assert");

// Load the page from localhost
zombie.visit("http://localhost:3000/", function (err, browser, status) {

  // Fill email, password and submit form
  browser.
    fill("email", "zombie@underworld.dead").
    fill("password", "eat-the-living").
    pressButton("Sign Me Up!", function(err, browser, status) {

      // Form submitted, new page loaded.
      assert.equal(browser.text("title"), "Welcome To Brains Depot");

    })

});
