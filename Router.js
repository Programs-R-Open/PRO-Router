export default class Router extends HTMLElement{


	constructor(json = undefined, def = undefined) {
		super();

		this.storage = {};
		this.subjects = {};
		this.routes = undefined;
		this.preloadedRoutes = {};
		if(json) this.routes = json;
		this.preloadRoutes();
		if(def) this.defaultRoute = this.resolve(def);
		if(json) this.goto(decodeURIComponent(document.location.pathname));

		
	}

	preloadRoutes() {
		this.routes.forEach(route => {
			
			this.preloadRoute("", route, this.preloadedRoutes);
		});
	}

	preloadRoute(currentPath, route, object) {
		let data = {};
		data["router"] = this;
		data["name"] = route.name;
		
		object[route.name] = {}; 
		let current = object[route.name];
		current.name = route.name;
		current.element = route.element;
		current.preload = route.preload;
		current.route = this.resolve(currentPath + "/" + current.name);

		if(route.preload && route.element) {
			current.instance = new route.element(this, data);
			current.instance.hide();
		}
			

		if (route.childs) {
			current.childs = {};
			route.childs.forEach(child=>{
				this.preloadRoute(current.route, child, current.childs);
			});
		}
	}

	goto(route) {
		route = this.resolve(route);
		if(this.lastRoute == route) return; 
	
		if(this.lastRoute) this.unloadRoute(this.lastRoute);
		this.loadRoute(route);
	}

	resolve(route) {
		if (route == "") return "/";

		route = route.split("/")
		.filter(part=>{
			return part != "" && part != ".";
		});

		if (route == "") return "/";

		route = route.reduce((full, part)=>{
			return full + "/" + part;
		});

		if(!route.startsWith("/")) route = "/" + route;
		
		return route;
	}


	loadRoute(route) {
		route = this.resolve(route);
		route = this.getRoute(route);


		if(route.route.instance) {
			route.route.instance.show();
		} else {
			route.route.instance = new route.route.element(this, route);
		}

		if(route.route.instance.update) route.route.instance.update();
		
		this.lastRoute = route.fullPath;
		history.pushState({}, '', this.lastRoute);
	}

	unloadRoute(route) {
		route = this.resolve(route);
		route = this.getRoute(route);

		if (route.route.preload) route.route.instance.hide();
		else {
			route.route.instance.parentElement.removeChild(route.route.instance);
			route.route.instance = undefined;
		} 
	}

	setRoutes(routes, def = undefined) {
		this.routes = routes;

		if(def) this.defaultRoute = this.getRoute(def);
		this.goto(document.location.pathname);
	}


	getRoute(route) {
		let current = this.preloadedRoutes;
		let result = {};

		result.params = {};

		let fullName = "";

		route.split("/").filter(dir => {return dir != ""}).forEach(level => {
			if (current.childs) current = current.childs;
			
			current = Object.values(current).find((currentRoute)=>{
				
				if (this.resolve(currentRoute.name) == this.resolve(level)) return currentRoute;
				
				if(currentRoute.name == "/*") return currentRoute;
				
				if(currentRoute.name.startsWith("/:")) {
					result.params[currentRoute.name.slice(2)] = level;
					return currentRoute;
				}

			});
		});

		if (route == "/") return this.getRoute(this.defaultRoute);

		if (!current) return undefined;
		if (current instanceof Array) return undefined;

		result.route = current;
		result.fullPath = route;
		result.router = this;

		if (current.access != undefined) {
			if(current.access instanceof Function)
				if (!current.access())
					return this.getRoute(current.redirect);
		} 
		else if (current.redirect) return this.getRoute(current.redirect);

		return result;
	}

	setURI(URI){
		history.pushState({}, '', URI);
	}

	create(json) {
		let data = {};
		data["params"] = {};
		data["storage"] = this.storage;
		data["router"] = this;
		data["name"] = json.route.name;
		
		if (json.params) Object.entries(json.params).forEach(([k,v]) => data.params[k] = v);

		let instance = new json.route.element(this, data);
		this.lastInstance = instance;
		json.instance = instance;
		this.appendChild(instance);
	}

	addEvent(key, cb) {
		if(!this.subjects[key]) this.subjects[key] = [];
		this.subjects[key].push(cb);
	}

	store(key, value) { 
		this.storage[key] = value;
		if(this.subjects[key] instanceof Array)
			this.subjects[key].forEach(func => func(this.storage[key])); 
	}
}

customElements.define('pro-router', Router);