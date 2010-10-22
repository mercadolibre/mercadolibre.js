;(function() {

<% BUILD.each do |uri| %>
<%= open(uri).read %>
<% end %>

})();
