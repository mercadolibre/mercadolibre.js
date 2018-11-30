<h1 align="center">
  <a href="http://developers.mercadolibre.com/es/">
    <img src="https://user-images.githubusercontent.com/1153516/29861072-689ec57e-8d3e-11e7-8368-dd923543258f.jpg" alt="Mercado Libre Developers" width="230"></a>
  </a>
  <br>
  MercadoLibre's JavaScript SDK
  <br>
</h1>

<h4 align="center">This is the official JavaScript SDK for MercadoLibre's Platform.</h4>

<p align="center">The JavaScript SDK enables you to access the API from a Web Browser.
It  hides all the complexity of OAuth 2.0 and lets you focus on writing application code.</p>

## How do I install it?

Just include the following source script in your application

    <script src="http://static.mlstatic.com/org-img/sdk/mercadolibre-1.0.4.js"></script>

For https use:

    <script src="https://a248.e.akamai.net/secure.mlstatic.com/org-img/sdk/mercadolibre-1.0.4.js"></script>

Initialize the API with your client_id as follows:

```js
MELI.init({ client_id: 6586 });
```

That's it. Afterwards, this line of code will show the First Name of your registration in MELI:

```js
MELI.login(function() {
  MELI.get("/users/me", {}, function(data) {
    alert("Hello " + data[2].first_name);
  });
});
```

Under the hood, the JSSDK checks that:

* You are actually you
* The app “melidev” (client_id #6586 in this example) is the actual caller
* You authorized the app “melidev” to access your data

## HTTPS connection

To use the SDK in HTTPS you need to configure the xd_url parameter to point to https://secure.mlstatic.com/org-img/sdk/xd-1.0.4.html

You do this by passing these parameters:

* xauth_protocol: "https://"
* xauth_domain: "secure.mlstatic.com"
* xauth_port: nothing, default 80
* xd_url: /org-img/sdk/xd-1.0.4.html

```js
MELI.init({
  client_id: 6586,
  xauth_protocol: "https://",
  xauth_domain: "secure.mlstatic.com",
  xd_url: "/org-img/sdk/xd-1.0.4.html"
});
```

## API Methods

<div class="ch-box">
	<div id="init">
		<p><strong>init</strong>(options)</p>
		<div>
			<p>Sets options to init	MELI SDK javascript.</p>
			<p>This method initialize <a href="http://tools.ietf.org/pdf/draft-ietf-oauth-v2-12.pdf">OAuth 2.0</a> protocol.</p>

<code>client_id</code> ( int ) - mandatory. <br/>
Application <strong>ID</strong> to retrieve the corresponding access tokens created with the <a href="http://applications.mercadolibre.com/">application manager</a> <br/>

<code>xauth_domain</code> ( String ) - optional.
<br/>
<code>xd_url</code> ( String ) - optional.
<br/>
<code>xauth_protocol</code> ( String ) - optional.
<br/>

```js
/**
 * Use your application ID to retrieve the corresponding access tokens
 * created with the application manager
 */
MELI.init({ client_id: 6586 });
```

</div>

<div class="ch-box">
	<div id="login">
		<p><strong>login</strong>(callback)</p>
		<div>
			<p>Login in MercadoLibre. It will open a new window popup to complete login process in MercadoLibre if it is necessary.</p>
			<code> callback </code> ( function )<br/>
			<p>This function is called when user login process is complete.</p>

```js
/**
 * Login into mercadolibre
 */
MELI.login(function() {
  // Your code here
});
```

</div>

<div class="ch-box">
	<div id="logout">
		<p><strong>logout</strong>()</p>
		<div>
			<p>Logout process expires access token</p>

```js
/**
 * Logouts MELI from MercadoLibre and invalidates access token.
 */
MELI.logout();
```

</div>

<div class="ch-box">
	<div id="getToken">
		<p><strong><strong>getToken</strong>()</strong></p>
		<div>
			<p>Obtains an access token if the user is logged.</p>
			<p>Following autorization state of the user it retrieves necessary token to connect with MercadoLibre API.</p>

```js
if (!MELI.getToken()) {
  // Your code here
}
```

</div>

<div class="ch-box">
	<div id="getLoginStatus">
		<p><strong>getLoginStatus</strong>(callback)</p>
		<div>
			<p>Retrieves logins status</p>
			<code>callback</code> ( function )<br/>
			<p>This function is called with the login status.</p>
			<p>They are three possible status:</p>
      <ol class="ch-list">
        <li><code>UNKNOWN</code></li>
        <li><code>NOT_AUTHORIZED</code></li>
        <li><code>AUTHORIZED</code></li>
      </ol>

```js
/**
 * Retrieves the autorization state
 */
MELI.getLoginStatus(function(data) {
  // Your code here
});
```

</div>

<div class="ch-box">
	<div id="get">
		<p><strong>get</strong>(url, params, callback)</p>
		<div>
			<p>Executes a GET request retrieving information identified by the resource.</p>

```js
/**
 * Invokes https://api.mercadolibre.com/users/me?access_token=...
 *
 */
MELI.get("/users/me", null, function(data) {
  // Your code here
  // var name = data[2]
});
```

</div>

<div class="ch-box">
	<div id="post">
		<p><strong>post</strong>(url, params, callback)</p>
		<div>
			<p>Executes a POST request creating a new resource using javascript SDK. </p>

```js
MELI.post(url, params, function(data) {
  // Your code here
});
```

</div>

<div class="ch-box">
	<div id="put">
		<p><strong>put</strong>(url, params, callback)</p>
		<div>
			<p>Executes a PUT request changing a resource using javascript SDK. </p>

```js
MELI.put(url, params, function(data) {
  // Your code here
});
```

</div>

<div class="ch-box">
	<div id="remove">
		<p><strong>remove</strong>(url, params, callback)</p>
		<div>
			<p>Executes a DELETE request deleting a resource using javascript SDK. </p>

```js
MELI.remove(url, params, function(data) {
  // Your code here
});
```

</div>

You can contact us if you have questions using the standard communication channels described in the [developer's site](http://developers.mercadolibre.com/community/)

## Contribute

If you want to contribute or you find something that needs to be fixed, just fork our SDK in [GitHub](https://github.com/mercadolibre/mercadolibre.js) and pull requests as needed.
