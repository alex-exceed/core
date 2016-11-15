describe('Bootstrap', function() {

	var Bootstrap = $import('ima/Bootstrap');
	var ObjectContainer = $import('ima/ObjectContainer');

	var bootstrap = null;
	var objectContainer = null;
	var environments = {
		prod: {},
		test: {},
		dev: {}
	};
	var plugin = {
		$registerImaPlugin: function() {},
		initSettings: function() {
			return environments;
		},
		initBind: function() {}
	};
	var bootConfig = {
		plugins: [
			plugin
		],
		initSettings: function() {
			return environments;
		},
		initBindIma: function() {},
		initBindApp: function() {},
		initRoutes: function() {},
		bind: {},
		routes: {}
	};

	beforeEach(function() {
		objectContainer = new ObjectContainer(ns);
		bootstrap = new Bootstrap(objectContainer);

		bootstrap._config = bootConfig;
	});

	describe('run method', function() {

		beforeEach(function() {
			spyOn(bootstrap, '_initSettings')
				.and
				.stub();

			spyOn(bootstrap, '_bindDependencies')
				.and
				.stub();

			spyOn(bootstrap, '_initServices')
				.and
				.stub();

			spyOn(bootstrap, '_initRoutes')
				.and
				.stub();

			bootstrap.run(bootConfig);
		});

		it('should initialize settings', function() {
			expect(bootstrap._initSettings).toHaveBeenCalled();
		});

		it('should bind dependencies', function() {
			expect(bootstrap._bindDependencies).toHaveBeenCalled();
		});

		it('should initialize services', function() {
			expect(bootstrap._initServices).toHaveBeenCalled();
		});

		it('should initialize routes', function() {
			expect(bootstrap._initRoutes).toHaveBeenCalled();
		});
	});

	describe('_initSettings method', function() {

		beforeEach(function() {
			spyOn(bootstrap, '_getEnvironmentSetting')
				.and
				.returnValue({});
		});

		it('it should call initSettings method for app', function() {
			spyOn(bootConfig, 'initSettings')
				.and
				.callThrough();

			bootstrap._initSettings();

			expect(bootConfig.initSettings).toHaveBeenCalled();
		});

		it('it should call initSettings method for plugin', function() {
			spyOn(plugin, 'initSettings')
				.and
				.callThrough();

			bootstrap._initSettings();

			expect(plugin.initSettings).toHaveBeenCalled();
		});
	});

	describe('_bindDependencies method', function() {

		it('should set ima binding state to object container', function() {
			spyOn(objectContainer, 'setBindingState').and.callThrough();

			bootstrap._bindDependencies();

			expect(objectContainer.setBindingState).toHaveBeenCalledWith(ObjectContainer.IMA_BINDING_STATE);
		});

		it('should set plugin binding state to object container', function() {
			spyOn(objectContainer, 'setBindingState').and.callThrough();

			bootstrap._bindDependencies();

			expect(objectContainer.setBindingState).toHaveBeenCalledWith(ObjectContainer.PLUGIN_BINDING_STATE);
		});

		it('should set app binding state to object container', function() {
			spyOn(objectContainer, 'setBindingState').and.callThrough();

			bootstrap._bindDependencies();

			expect(objectContainer.setBindingState).toHaveBeenCalledWith(ObjectContainer.APP_BINDING_STATE);
		});

		it('should bind ima', function() {
			spyOn(bootConfig, 'initBindIma');

			bootstrap._bindDependencies();

			expect(bootConfig.initBindIma).toHaveBeenCalledWith(ns, objectContainer, {});
		});

		it('should bind ima plugin', function() {
			spyOn(plugin, 'initBind');

			bootstrap._bindDependencies();

			expect(plugin.initBind).toHaveBeenCalledWith(ns, objectContainer, {});
		});

		it('should bind app', function() {
			spyOn(bootConfig, 'initBindApp');

			bootstrap._bindDependencies();

			expect(bootConfig.initBindApp).toHaveBeenCalledWith(ns, objectContainer, {});
		});

	});

	describe('_initRoutes method', function() {

		it('should initalize app route', function() {
			spyOn(bootConfig, 'initRoutes');

			bootstrap._initRoutes();

			expect(bootConfig.initRoutes).toHaveBeenCalledWith(ns, objectContainer, bootConfig.routes);
		});

	});

});
