require "webrick"

server = WEBrick::HTTPServer.new(
  :AccessLog => [],
  :Logger => WEBrick::Log::new("/dev/null", 7),
  :Port => 8080,
  :DocumentRoot => File.expand_path("..", File.dirname(__FILE__))
)

trap(:INT) { server.shutdown }

server.start
