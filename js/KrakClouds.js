export default function Clouds(config){
	var baseConfig = {
		// Number of clouds in the sky.
		clouds: 10
	};

	for(let k in config)
		if(config.hasOwnProperty(k))
			baseConfig[k] = config[k];

	for(let k in baseConfig)
		this[k] = baseConfig[k];

	{
		var me = this;

		me.cloud_update = function(newTime){
			var ctx = me.context;

			if(me.interval)
				clearTimeout(me.interval);

			// Calculate how long it's been since the last frame in seconds.
			if(!newTime)
				newTime = window.performance.now();
			var time = ((me.lastUpdateTime ?
				((newTime) - me.lastUpdateTime) :
				0
			) / 1000);
			me.lastUpdateTime = newTime;

			// If an extreme amount of time has passed, it's probably because the
			// rendering was paused for a while. We want to pretend this didn't
			// happen.
			if(time > 1)
				time = 0.5;

			// Clear the current frame.
			ctx.clearRect(0, 0, me.w, me.h);

			for(let cloud_it = 0, cloud_len = me.active_clouds.length; cloud_it < cloud_len; cloud_it++){
				let orbConfig = me.active_clouds[cloud_it];

				let drift = orbConfig.speed * time;
				let cloud_out = true;

				ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
				for(let orb_it = 0, orb_len = orbConfig.list.length; orb_it < orb_len; orb_it++){
					let orb = orbConfig.list[orb_it];

					orb.cx += drift;

					// Is this orb still on screen?
					if((orb.cx + orb.r) < (me.w * 1.25))
						cloud_out = false;

					ctx.beginPath();
					ctx.arc(orb.cx + 10, orb.cy + 10, orb.r, 0, 2 * Math.PI);
					ctx.fill();
				}

				ctx.fillStyle = orbConfig.fill;
				for(let orb_it = 0, orb_len = orbConfig.list.length; orb_it < orb_len; orb_it++){
					let orb = orbConfig.list[orb_it];

					ctx.beginPath();
					ctx.arc(orb.cx, orb.cy, orb.r, 0, 2 * Math.PI);
					ctx.fill();
				}

				if(cloud_out)
					me.active_clouds[cloud_it] = me.cloud_make();
			}

			// Queue up the next frame.
			me.interval = setTimeout(function(){
				window.requestAnimationFrame(me.cloud_update);
			}, 1000 / 60);
		};
	}
};
Clouds.prototype = {
	init: function(){
		this.resize();
		window.addEventListener('resize', this.resize.bind(this));

		this.context = this.canvas.getContext('2d');

		this.active_clouds = [];
		for(var i = 0; i < this.clouds; i++)
			this.active_clouds.push(this.cloud_make(true));

		this.cloud_update();
	},

	// Adjust the canvas, based on the size of the window
	resize: function(){
		this.canvas.height = this.h = this.height = 900;
		this.canvas.width = this.w = 1500;
	},

	// Produce a new, random cloud.
	cloud_make: function(randomPos){
		var orbs = parseInt(Math.random() * 5) + 5;
		let r = 1.25 * ((Math.random() * 20) + 20);

		var base = {
			cx: (randomPos ? ((Math.random() * this.w * 1.5) - (this.w * 0.25)) : -(this.w * 0.25)),
			cy: (((Math.random() * this.h) / 4) + (2.5 * r)),
			r: r
		};

		var cloudList = [ base ];
		let arc = Math.random() * 2 * Math.PI;
		for(var i = 0; i < orbs; i++){
			let r = (base.r + (1.5 * base.r * Math.random()));

			cloudList.push({
				cx: (base.cx + (Math.cos(arc) * base.r * 2)),
				cy: (base.cy + (Math.sin(arc) * base.r / 2)),
				r: r
			});

			arc += Math.random() * Math.PI;
		}

		return {
			fill: ('#ff' + (0xff - parseInt((Math.random() * 20) * 0x02)).toString(16) + 'ff'),
			speed: parseInt(10 + (Math.random() * 30)),
			list: cloudList
		};
	}
};

class KrakClouds extends HTMLElement {
	constructor(){
		super();

		var style = document.createElement('style');
		style.textContent = `
			krak-snow {
				position: relative;
			}
			canvas.krakclouds {
				opacity: 0.8;
				width: 100%;
				z-index: 9001;
				pointer-events: none;
			}
		`;

		// Attach elements to the page.
		this.appendChild(style);

		// Create the canvas we'll draw on.
		{
			let canvas = document.createElement('canvas');

			canvas.classList.add('krakclouds');
			this.appendChild(canvas);

			this.clouds = new Clouds({
				canvas: canvas
			});
		}

		// Start the effect.
		this.clouds.init();
	}
};

customElements.define('krak-clouds', KrakClouds);
