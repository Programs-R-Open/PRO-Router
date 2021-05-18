
export default class Router extends HTMLElement{


	constructor(json, def) {
		super();

		this.routes = json;

		/*this.routes.forEach( route => {
			route["instance"] = new route.element(this);
			route["instance"].style.display = "none";
			this.appendChild(route["instance"]);
		});*/


		if (def) this.goto(def);
	}

	goto(route) {
		
		//this.getRoute(this.lastRoute).instance.style.display = "none";
		//this.getRoute(route).instance.style.display = "";
		if(this.lastRoute == route) return; 

		this.create(route);
		if (this.lastRoute) this.getRoute(this.lastRoute).instance.remove();
		this.lastRoute = route;
	}

	create(route) {
		let json = this.routes;
		let data = {};
		data.router = this;
		data["params"] = {};
		route.split("/").forEach(level => {
			if (json.childs) json = json.childs; 
			json = json.find(item => {
				if (item.name.startsWith(":")) data.params[item.name.slice(1)] = level;
				return item.name == level || item.name.startsWith(":")
			});
		});

		let instance = new json.element(data);
		json.instance = instance;
		this.appendChild(instance);
	}

	getRoute(route) {
		let json = this.routes;
		
		route.split("/").forEach(level => {
			if (json.childs) json = json.childs; 
			json = json.find(item => item.name == level || item.name.startsWith(":"));
		});
		return json;
	}


	addMenu() {

	}
}

customElements.define('pro-router', Router);