{% load i18n %}
//Print Action
var printWindow = new Ext.Window({
	id: 'print-toolbar-window',
	autoHeight: true,
	layout: 'fit',
	resizable: false,
	closable: false,
	listeners: {
		hide: function(window) {
			printExtent.map.events.unregister("zoomend", this, this.updatePrintScales);
			printExtent.hide();
		},
		show: function(window) {
			this.updatePrintScales();
			//printExtent.page.setRotation(0, true);
			printExtent.page.setCenter(printExtent.map.getCenter());
			printExtent.map.events.register("zoomend", this, this.updatePrintScales);
			printExtent.page.on('change', function(print, mods) {
				if (mods.hasOwnProperty('rotation')) {
					this.rotationSpinner.setValue(mods.rotation);
				}
			}.bind(this));
			//window.setWidth(toolbar.getWidth());
			printExtent.control.renderIntent = WebgisStyles.print_style;
			printExtent.show();
		},
		beforeshow: function(window) {
			// calculate window's width from toolbar size
			var toolbar = window.getTopToolbar();
			var first_toolbar_item = toolbar.items.first();
			var last_toolbar_item = toolbar.items.last();
			var toolbar_width = last_toolbar_item.getPosition()[0]-first_toolbar_item.getPosition()[0]+last_toolbar_item.getWidth();
			window.setWidth(toolbar_width+2*(first_toolbar_item.getPosition()[0]-window.getPosition()[0]));
		},
		render: function(window) {
			var map = new Ext.KeyMap(window.getEl(), [
				{
					key: [10, 13],
					fn: function() {
						window.print.handler.call(window.print.scope, window.print, Ext.EventObject);
					}
				}
			]);
		}
	},
	updatePrintScales: function() {
		var map_scale = Math.round(printExtent.map.getScale());
		printExtent.printProvider.capabilities.scales = [{"name":"1:"+Number(map_scale).toLocaleString(), "value": map_scale}]
		printExtent.printProvider.scales.loadData(printExtent.printProvider.capabilities);
		if (printExtent.pages.length == 0) {
			printExtent.addPage();
		}
		printExtent.page.setScale(printExtent.printProvider.scales.getAt(0), printExtent.map.getUnits());
	},
	tbar: [
		{
			xtype: 'combo',
			id: 'print-layouts-combobox',
			width: 130,
			editable: false,
			tooltip: '{% trans "Print layout" %}',
			mode: 'local',
			triggerAction: 'all',
			readonly: true,
			store: new Ext.data.JsonStore({
				// store configs
				data: printExtent.printProvider.capabilities,
				storeId: 'print-layouts-store',
				// reader configs
				root: 'layouts',
				fields: [{
					name: 'name',
					type: 'string'
				}, ]
			}),
			valueField: 'name',
			displayField: 'name',
			listeners: {
				afterrender: function(combo) {
					Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
					var recordSelected = combo.getStore().getAt(0);
					combo.setValue(recordSelected.get('name'));
					combo.fireEvent('select', combo, recordSelected, 0);
				},
				select: function (combo, record, index) {
					var layout = printExtent.printProvider.layouts.getAt(index); // record value doesn't work
					printExtent.printProvider.setLayout(layout, true);

					var window = combo.ownerCt.ownerCt;
					window.removeAll();
					if (layout.json.labels.length > 0) {
						var form_fields = [];
						Ext.each(layout.json.labels, function(label) {
							if (!label.startsWith("gislab_")) {
								form_fields.push({
									fieldLabel: label,
									name: label,
									allowBlank: true
								});
							}
						});
						window.add({
							xtype: 'form',
							labelWidth: 100,
							frame: true,
							defaults: {
								anchor: "100%",
							},
							autoHeight: true,
							defaultType: 'textfield',
							items: form_fields,
						});
					}
					if (window.isVisible()) {
						window.doLayout();
					}
					printWindow.syncShadow();
				}
			}
		}, ' ', {
			xtype: 'combo',
			id: 'print-dpi-combobox',
			width: 70,
			editable: false,
			tooltip: '{% trans "Resolution" %}',
			mode: 'local',
			triggerAction: 'all',
			forceSelection: true,
			store: new Ext.data.JsonStore({
				// store configs
				data: printExtent.printProvider.capabilities,
				storeId: 'print-dpi-store',
				// reader configs
				root: 'dpis',
				fields: [{
					name: 'name',
					type: 'string'
				}, {
					name: 'value',
					type: 'int'
				}]
			}),
			valueField: 'value',
			displayField: 'name',
			listeners: {
				afterrender: function(combo) {
					Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
					var recordSelected = combo.getStore().getAt(0);
					combo.setValue(recordSelected.get('name'));
					combo.fireEvent('select', combo, recordSelected, 0);
				},
				select: function (combo, record, index) {
					printExtent.printProvider.setDpi(record);
				}
			}
		}, ' ', {
			xtype: 'combo',
			ref: '/formatCombobox',
			width: 70,
			editable: false,
			tooltip: '{% trans "Output file format" %}',
			mode: 'local',
			triggerAction: 'all',
			forceSelection: true,
			store: new Ext.data.JsonStore({
				// store configs
				data: printExtent.printProvider.capabilities,
				storeId: 'print-format-store',
				// reader configs
				root: 'outputFormats',
				fields: [{
					name: 'name',
					type: 'string'
				}]
			}),
			valueField: 'name',
			displayField: 'name',
			listeners: {
				afterrender: function(combo) {
					Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
					var recordSelected = combo.getStore().getAt(0);
					combo.setValue(combo.getStore().getAt(0).get('name'));
				}
			}
		}, ' ', {
			xtype: 'label',
			text: '{% trans "Rotation" %}'
		}, ' ', {
			xtype: 'spinnerfield',
			ref: '/rotationSpinner',
			width: 60,
			value: 0,
			allowNegative: true,
			autoStripChars: true,
			allowDecimals: false,
			minValue: -360,
			maxValue: 360,
			enableKeyEvents: true,
			listeners: {
				spin: function () {
					printExtent.page.setRotation(this.getValue(), true);
				},
				keyup: function (textField, event) {
					printExtent.page.setRotation(this.getValue(), true);
					event.stopPropagation();
				},
				keydown: function (textField, event) {
					event.stopPropagation();
				},
				keypress: function (textField, event) {
					event.stopPropagation();
				}
			}
		}
	],
	bbar: ['->', new Ext.Action({
			ref: '/print',
			text: '{% trans "Create" %}',
			tooltip: '{% trans "Create print output" %}',
			tooltipType: 'qtip',
			iconCls: '',
			handler: function(action) {
				var print_window = Ext.getCmp('print-toolbar-window');
				var layers = [];
				var base_layer = printExtent.map.baseLayer;
				if (base_layer && base_layer.CLASS_NAME == 'OpenLayers.Layer.WMS') {
					layers.push(base_layer.name);
				}
				var overlays_root = Ext.getCmp('layers-tree-panel').root;
				layers = layers.concat(overlays_root.getVisibleLayers().reverse());
				var params = {
					SERVICE: 'WMS',
					REQUEST: 'GetPrint',
					FORMAT: print_window.formatCombobox.getValue(),
					DPI: printExtent.printProvider.dpi.get("value"),
					TEMPLATE: printExtent.printProvider.layout.get("name"),
					LAYERS: layers.join(','),
					SRS: printExtent.map.projection.getCode(),
					'map0:extent': printExtent.page.getPrintExtent(printExtent.map).toBBOX(1, false),
					'map0:rotation': -printExtent.page.rotation,
				}
				if (printExtent.map.getUnits() != 'dd') {
					params['map0:scale'] = printExtent.page.scale.get("value");
				}
				// labels
				if (print_window.items.length > 0) {
					var labels_data = print_window.get(0).getForm().getValues();
					for (label in labels_data) {
						params[label] = labels_data[label] || ' ';
					}
				}
				// layers copyrights
				var attributions = [];
				overlays_root.root.cascade(function(node) {
					if (node.isLeaf() && node.attributes.checked) {
						var attribution = node.attributes.config.attribution;
						if (attribution && attribution.title) {
							if (attributions.indexOf(attribution.title) == -1) {
								attributions.push(attribution.title);
							}
						}
					}
				});
				Ext.applyIf(params, {
					gislab_project: '{{ root_title }}',
					gislab_author: '{{ user.get_full_name }}',
					gislab_contact: '<div style="position:absolute;bottom:0;right:0;font-family:Liberation Sans;"><span>{{ organization }}<br />{{ email }}</span></div>',
					gislab_copyrights: String.format('<div style="background-color:rgba(255,255,255,0.3);position:absolute;bottom:0;right:0;padding-left:8px;padding-right:8px;font-family:Liberation Sans;">{0}</div>', Ext.util.Format.htmlEncode(attributions.join(', ')))
				});

				var printUrl = Ext.urlAppend('{% autoescape off %}{{ ows_url }}{% endautoescape %}', Ext.urlEncode(params))
				window.open(printUrl, '_blank');
				//action.toggle(false);
			}
		})
	],
});

action = new Ext.Action({
	id: 'print-action',
	map: mappanel.map,
	cls: 'x-btn-icon',
	iconCls: 'print-icon',
	enableToggle: true,
	toggleGroup: 'tools',
	tooltip: '{% trans "Print output creation" %}',
	toggleHandler: function(button, toggled) {
		if (toggled) {
			printWindow.show();
			printWindow.alignTo(mappanel.getTopToolbar().getId(), 'tl-bl', [70, 0]);
		} else {
			printWindow.hide();
		}
	},
});
mappanel.getTopToolbar().add(action);
