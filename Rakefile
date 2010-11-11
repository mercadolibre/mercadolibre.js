require "open-uri"
require "tmpdir"
require "erb"

BUILD = [
  "vendor/cookie.js",
  "tmp/sroc.js",
  "src/mercadolibre.js",
]

directory "pkg"
directory "tmp"

file "sroc.js" => "tmp" do |t|
  target = File.expand_path("tmp/#{t.name}")

  Dir.mktmpdir do |path|
    Dir.chdir(path) do
      system "wget --no-check-certificate -q https://github.com/mercadolibre/sroc/tarball/master -O sroc.tar.gz"
      system "tar xf sroc.tar.gz --strip 1"
      system "rake"
      system "cp pkg/sroc.js #{target}"
    end
  end
end

file "mercadolibre.js" => ["pkg", "sroc.js"] do |t|
  File.open("pkg/#{t.name}", "w") do |file|
    file.write ERB.new(File.read("src/build.erb.js")).result(binding)
  end
end

task :minify do
  system "java -jar vendor/yuicompressor-2.4.2.jar --type js pkg/mercadolibre.js -o pkg/mercadolibre.min.js"
end

task :build => "mercadolibre.js" do
end

task :default => [:build, :minify]

task :test => :build do
  require "cutest"
  Cutest.run(Dir["test/test.rb"])
end
