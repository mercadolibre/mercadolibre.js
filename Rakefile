require "open-uri"

DEPENDENCIES = [
  "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.js",
  "http://plugins.jquery.com/files/jquery.cookie.js.txt",
  "src/mercadolibre.js",
]

directory "pkg"

file "mercadolibre.js" => "pkg" do |t|
  File.open("pkg/#{t.name}", "w") do |file|
    file.puts(";(function() {")
    file.puts

    DEPENDENCIES.each do |uri|
      io = open(uri)

      while line = io.gets
        file.puts(line)
      end
    
      file.puts
    end

    # Until we remove jQuery...
    file.puts("jQuery.noConflict();")
    file.puts

    file.puts("})();")
  end
end

task :minify do
  system "java -jar vendor/yuicompressor-2.4.2.jar --type js pkg/mercadolibre.js -o pkg/mercadolibre.min.js"
end

task :build => "mercadolibre.js" do
end

task :default => [:build, :minify]

task :test do
  require "selenium-webdriver"

  driver = Selenium::WebDriver.for(:firefox)

  driver.navigate.to "file://#{File.expand_path("test/index.html", File.dirname(__FILE__))}"

  element = driver.find_element(:xpath, "//*[@id='qunit-testresult']/*[@class='failed']")

  while element.text.to_s.empty?; end

  failed = element.text.to_i

  if failed > 0
    $stderr.puts "Test failed -- browser left open."
    exit 1
  else
    driver.quit
  end
end
