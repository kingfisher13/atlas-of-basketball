require "stringex"
class Jekyll < Thor
  desc "new", "create a new post"
  method_option :editor, :default => "atom"
  def new(*title)
    title = title.join(" ")
    date = Time.now.strftime('%Y-%m-%d')
    postfilename = "_posts/#{date}-#{title.to_url}.md"
    jsfilename = "_includes/visualization-assets/js/#{title.to_url}.js"
    cssfilename = "_includes/visualization-assets/css/#{title.to_url}.css"

    if File.exist?(postfilename)
      abort("#{postfilename} already exists!")
    end

    puts "Creating new post: #{postfilename}"
    open(postfilename, 'w') do |post|
      post.puts "---"
      post.puts "layout: post"
      post.puts "title: \"#{title.gsub(/&/,'&amp;')}\""
      post.puts "date: #{date}"
      post.puts "tags:"
      post.puts "externals:"
      post.puts "- d3"
      post.puts "- underscore"
      post.puts "js:"
      post.puts "- #{title.to_url}.js"
      post.puts "css:"
      post.puts "- #{title.to_url}.css"
      post.puts "json:"
      post.puts "---"
    end

    puts "Creating new js file: #{jsfilename}"
    open(jsfilename, 'w') do |post|
      post.puts "/*"
      post.puts "* #{title} Visualization JS"
      post.puts "*/"
    end

    puts "Creating new css file: #{cssfilename}"
    open(cssfilename, 'w') do |post|
      post.puts "/*"
      post.puts "* #{title} Visualization CSS"
      post.puts "*/"
    end

    system(options[:editor], postfilename, jsfilename, cssfilename)
  end
end
