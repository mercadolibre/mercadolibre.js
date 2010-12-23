require "cutest"
require "capybara/dsl"
require "selenium-webdriver"

include Capybara

Thread.new do
  require File.expand_path("server", File.dirname(__FILE__))
end

Capybara.default_driver = :selenium
Capybara.app_host = "http://localhost:8080"
Capybara.run_server = false
Capybara.default_selector = :css
Capybara.default_wait_time = 60

def evaluate(script)
  page.evaluate_script(script)
end

class Capybara::Driver::Selenium
  def within_window(name)
    old_name = browser.window_handle
    browser.switch_to.window(name)
    yield
  ensure
    browser.switch_to.window(old_name)
  end
end

def login(username = "TEST_GABY_ARGENTINA", password = "qatest")
  page.driver.within_window("mercadolibre-login") do
    find("input[name='user']").set(username)
    find("input[name='password']").set(password)
    click "Ingresar"
    # click "Permitir"
  end
end

def test_data
  evaluate "window.testData"
end

test "does not interfere with the hash" do
  visit "/test#foo=bar"

  assert_equal "#foo=bar", evaluate("window.location.hash")
end

test "MercadoLibre object is available" do
  visit "/test"

  assert page.evaluate_script("MercadoLibre")
end

test "Authentication and authorization" do
  visit "/test"

  evaluate <<-EOS
    MercadoLibre.requireLogin(function() {
      MercadoLibre.get("/users/me", function(response) {
        [status, headers, user] = response;
        window.testData.user = user;
      })
    })
  EOS

  login

  wait_until { test_data["user"] }

  assert !test_data["user"]["nickname"].empty?
  assert test_data["user"]["identification"]["type"] != nil
end

test "Posting data" do
  visit "/test"

  evaluate <<-EOS
    MercadoLibre.requireLogin(function() {
      MercadoLibre.get("/sites/MLA/search?q=ipod&limit=1", function(result) {
        testData.item = result.results[0].id

        MercadoLibre.get("/users/me", function(user) {
          MercadoLibre.post(
            "/questions",
            {
              text: "Lorem ipsum",
              from: {id: user.id},
              item_id: testData.item
            },
            function() {
              testData.posted = true
            }
          )
        })
      })
    })
  EOS

  wait_until { test_data["posted"] }

  evaluate <<-EOS
    MercadoLibre.get("/questions/search?item_id=" + testData.item, function(result) {
      testData.questions = result.questions
    })
  EOS

  questions = wait_until { test_data["questions"] }

  assert questions.any? { |question|
    question["text"] == "Lorem ipsum" && question["item_id"] == test_data["item"]
  }
end
