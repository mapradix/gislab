{% load i18n %}
// Featureinfo Action

var identify_layer_combobox = new Ext.form.ComboBox({
	width: 150,
	mode: 'local',
	disabled: true,
	tooltip: '{% trans "Active layer" %}',
	triggerAction: 'all',
	forceSelection: true,
	store: new Ext.data.JsonStore({
		data: {layers: []},
		storeId: 'search-layer-store',
		root: 'layers',
		fields: [{
			name: 'name',
			type: 'string'
		}]
	}),
	valueField: 'name',
	displayField: 'name',
	updateLayersList: function(layers_list) {
		var layers_options = ['{% trans "All visible layers" %}'].concat(layers_list);
		var store_data = [];
		Ext.each(layers_options, function(layername) {
			store_data.push({name: layername});
		});
		this.store.loadData({layers: store_data});
		if (layers_options.indexOf(this.getValue()) == -1) {
			this.setValue(layers_options[0]);
		}
	},
	listeners: {
		afterrender: function(combo) {
			Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
			// get list of queryable layers
			var queryable_layers = [];
			var layers_attrib_aliases = {};
			Ext.getCmp('layers-tree-panel').root.cascade(function(node) {
				if (node.isLeaf() && node.attributes.config.queryable) {
					queryable_layers.push(node.attributes.text);
					var attrib_aliases = {};
					Ext.each(node.attributes.config.attributes, function(attribute) {
						if (attribute.alias) {
							attrib_aliases[attribute.name] = attribute.alias;
						}
					});
					layers_attrib_aliases[node.attributes.text] = attrib_aliases;
				}
			});
			combo.queryableLayers = queryable_layers;
			Ext.getCmp('featureinfo-panel').setLayersAttributesAliases(layers_attrib_aliases);

			var on_visible_layers_changed = function(node, layer, visible_layers) {
				var layers_list = [];
				Ext.each(visible_layers, function(layer_name) {
					if (this.queryableLayers.indexOf(layer_name) != -1) {
						layers_list.push(layer_name);
					}
				}, this);
				this.updateLayersList(layers_list);
			}.bind(combo);

			var overlays_root = Ext.getCmp('layers-tree-panel').root;
			on_visible_layers_changed(overlays_root, overlays_root.layer, overlays_root.getVisibleLayers());
			overlays_root.on('layerchange', on_visible_layers_changed, combo);
		}
	}
});

ctrl = new OpenLayers.Control.WMSGetFeatureInfo({
	url: '{{ ows_url }}',
	autoActivate: false,
	infoFormat: 'application/vnd.ogc.gml',
	maxFeatures: 10,
	eventListeners: {
		getfeatureinfo: function(e) {
			Ext.getCmp('featureinfo-panel').showFeatures(e.features, identify_layer_combobox.layersAttributesAliases);
		}
	}
})
action = new GeoExt.Action({
	control: ctrl,
	map: mappanel.map,
	cls: 'x-btn-icon',
	iconCls: 'featureinfo-icon',
	enableToggle: true,
	toggleGroup: 'tools',
	group: 'tools',
	tooltip: '{% trans "Feature info" %}',
	toggleHandler: function(action, toggled) {
		identify_layer_combobox.setDisabled(!toggled);
	}
})
mappanel.getTopToolbar().add(action, identify_layer_combobox);