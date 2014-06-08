var invokeonetime={
	run: function(){
		this.checknewversion();
	},
	checknewversion: function(){
		var latestversion = "1.0.1";
		var currentversion = window.localStorage.getItem("mar-version");
		if(latestversion != currentversion){
			alert("New version 1.0.1 valid");
		}
	}
};