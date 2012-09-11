require "open-uri"
require "tmpdir"
require "erb"

BUILD = [
  "vendor/json2.js",
  "vendor/cookie.js",
  "vendor/des.js",
  "tmp/sroc.js",
  "vendor/xAuthServer.js",
  "vendor/xauth.js",
  "src/mercadolibre.js",
]

directory "pkg"
directory "tmp"

file "sroc.js" => "tmp" do |t|
  target = File.expand_path("tmp/#{t.name}")

  next if File.exist?(target)

  Dir.mktmpdir do |path|
    Dir.chdir(path) do
      system "curl -L -k -s https://github.com/mercadolibre/sroc/tarball/master -o sroc.tar.gz"
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
  system "java -jar vendor/compiler.jar --warning_level VERBOSE --charset utf-8 --compilation_level SIMPLE_OPTIMIZATIONS --js pkg/mercadolibre.js --js_output_file pkg/mercadolibre.min.js"
end

task :build => "mercadolibre.js" do
end

task :default => [:build, :minify]

task :wrapper => :build  do 
  system "sed -ie '/})(cookie, XAuth);/r src/mercadolibre_wrapper_only.js' pkg/mercadolibre.js"
  system "java -jar vendor/compiler.jar --warning_level VERBOSE --charset utf-8 --compilation_level SIMPLE_OPTIMIZATIONS --js pkg/mercadolibre.js --js_output_file pkg/mercadolibre.min.js"
end

task :zombie do
  sh "rm -rf vendor/zombie"
  sh "mkdir vendor/zombie"

  target = File.expand_path("vendor/zombie")

  Dir.mktmpdir do |path|
    Dir.chdir(path) do
      sh "git clone https://github.com/djanowski/zombie.git -q"

      Dir.chdir("zombie") do
        sh "git checkout -q origin/integration"
        sh "cake build"
        sh "rm -rf src"
        sh "cp package.json #{target}"
        sh "cp -r lib #{target}"
      end
    end
  end
end

task :release, :version do |t,args|
  
   raise "Please provide a release version. usage: rake release[1.0.0]." unless args.version
  
   buildTag = Git.processtag args.version
  
  `rm -rf pkg`
  
   puts ("Building tag: " + buildTag)

   build buildTag, buildTag.sub(/^v/, "") if buildTag
   
   deploy buildTag.sub(/^v/, "")

end

def build(sha1, version)
  stamp = Time.at(`git log #{sha1} --format='%ct' -1`.to_i)
  stamp = stamp.strftime("%Y%m%d%H%M.%S")

  `rake`
  `mkdir -p pkg/#{version}`
  `mv pkg/mercadolibre.js pkg/#{version}/mercadolibre-#{version}.js`
  `mv pkg/mercadolibre.min.js pkg/#{version}/mercadolibre-#{version}.min.js`
  
  `sed 's/{version}/#{version}/' src/xd.html > pkg/#{version}/xd-#{version}.html`
  `sed -i 's/{version}/#{version}/' pkg/#{version}/*.js`

  `touch -t #{stamp} pkg/#{version}/mercadolibre-#{version}.js`
  `touch -t #{stamp} pkg/#{version}/mercadolibre-#{version}.min.js`
end


def deploy(version)
	if askQuestion("Deploy release?")
		puts("Deploying release...")
		`scp pkg/#{version}/* oraweb@172.16.200.31:/data2/orange/images/sdk`
		puts("Deploy done")
	end
end


def askQuestion(question) 
 STDOUT.puts question +  "(y/n)"
 input = STDIN.gets.strip
 if input.downcase == 'y' || input == 'Y' 
     return true
 else
     $stderr.puts "Release aborted."
     exit 1
 end

end

class Git
  def self.processtag(version)
	   
	   tag = `git tag -l`["v" << version]
	   
	   if tag
	  	 `git checkout -q #{tag} 2>/dev/null`
	  	  unless $?.success?
            $stderr.puts "Need a clean working copy. Please git-stash away."
            exit 1
		  end
	   else 
	      if askQuestion("Version does not exist. Create one?")
	  	       tag = "v" << version
	  	      `git tag #{tag}`
	  	      `git push origin #{tag} 2>/dev/null` if $?.success?
	      end
	   end
	   
	  return tag
  end
  
end
