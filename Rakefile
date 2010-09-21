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
