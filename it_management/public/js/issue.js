// Copyright (c) 2019, IT-Geräte und IT-Lösungen wie Server, Rechner, Netzwerke und E-Mailserver sowie auch Backups, and contributors
// For license information, please see license.txt

cur_frm.dashboard.add_transactions([
    {
        'items': [
            'Timesheet',
			'Material Request',
			'Delivery Note',
			'IT Service Report'
        ],
        'label': 'Activity'
    }
]);

frappe.ui.form.on('Issue', {
	onload: function (frm) {
		// restrict Dynamic Links to IT Mnagement
		frm.set_query('dynamic_type', 'it_management_table', function () {
			return {
				'filters': {
					'module': 'IT Management',
					'istable': 0,
				}
			};
		});
		frm.set_query('project', function () {
			// restrict project to customer
			if (frm.doc.customer) {
				return {
					'filters': {
						'customer': frm.doc.customer,
					}
				};
			}
		});
		/* frm.set_query('task', function () {
			// restrict tasks to project
			if (frm.doc.project) {
				return {
					'filters': {
						'project': frm.doc.project,
					}
				};
			}
		}); */
	},
	refresh: function (frm) {
		if (!frm.is_new()) {
			frm.add_custom_button('Add Activity', function () { frm.trigger('add_activity') });
			frm.add_custom_button('Purchase Order', function () { frm.trigger('make_purchase_order') }, __("Make"));
			frm.add_custom_button('Delivery Note', function () { frm.trigger('make_delivery_note') }, __("Make"));
			frm.add_custom_button('IT Service Report', function () { frm.trigger('make_it_service_report') }, __("Make"));
			frm.add_custom_button('Sales Invoice', function () { frm.trigger('make_sales_invoice') }, __("Make"));
			frm.add_custom_button('IT Checklist', function () { frm.trigger('get_it_checklist') }, __("Get IT Managementtable from"));
		}
		//frm.trigger('render_contact');
	},
	contact: function (frm) {
        //frm.trigger('render_contact');
    },
	render_contact: function (frm) {
		if (frm.doc.contact && frm.doc.hasOwnProperty('__onload')) {
			frappe.contacts.render_address_and_contact(frm);
			// hide "New Contact" Button
			$('.btn-contact').hide();
		} else {
			cur_frm.fields_dict.contact_html.html();
		}
	},
	add_activity: function (frm) {
		activity_dialog(frm);
	},
	make_purchase_order: function (frm) {
		frappe.new_doc("Purchase Order", {
			"issue": frm.doc.name
		});
	},
	make_delivery_note: function (frm) {
		frappe.new_doc("Delivery Note", {
			"customer": frm.doc.customer,
			"project" : frm.doc.project,
			"issue": frm.doc.name
		});
	},
	make_it_service_report: function (frm) {
		frappe.new_doc("IT Service Report", {
			"issue": frm.doc.name,
			"project": frm.doc.project/*,
			"task": frm.doc.task*/
		});
	},
	make_sales_invoice: function (frm) {
		let dialog = new frappe.ui.Dialog({
			title: __("Select Item (optional)"),
			fields: [
				{"fieldtype": "Link", "label": __("Item Code"), "fieldname": "item_code", "options":"Item"},
				{"fieldtype": "Link", "label": __("Customer"), "fieldname": "customer", "options":"Customer", "default": frm.doc.customer}
			]
		});

		dialog.set_primary_action(__("Make Sales Invoice"), () => {
			var args = dialog.get_values();
			if(!args) return;
			dialog.hide();
			return frappe.call({
				type: "GET",
				method: "it_management.utils.make_sales_invoice",
				args: {
					"source_name": frm.doc.name,
					"item_code": args.item_code,
					"customer": args.customer
				},
				freeze: true,
				callback: function(r) {
					if(!r.exc) {
						frappe.model.sync(r.message);
						frappe.set_route("Form", r.message.doctype, r.message.name);
					}
				}
			});
		});
		dialog.show();
	},
	get_it_checklist: function (frm) {
		var d = new frappe.ui.Dialog({
			'fields': [
				{'fieldname': 'customer', 'fieldtype': 'Link', 'options': 'Customer', 'label': 'Customer', 'default': cur_frm.doc.customer},
				{'fieldname': 'cb_1', 'fieldtype': 'Column Break'},
				{'fieldname': 'type', 'fieldtype': 'Link', 'options': 'IT Checklist Type', 'label': 'Type'},
				{'fieldname': 'cb_2', 'fieldtype': 'Column Break'},
				{'fieldname': 'status', 'fieldtype': 'Select', 'options': [__('Implementing'), __('Running'), __('Issue'), __('Obsolet')].join('\n'), 'label': 'Status'},
				{'fieldname': 'sb_1', 'fieldtype': 'Section Break'},
				{'fieldname': 'result', 'fieldtype': 'HTML'}
			]
		});
		var $wrapper;
		var $results;
		var $placeholder;
		
		d.fields_dict["customer"].df.onchange = () => {
			var method = "it_management.utils.get_it_management_table";
			var args = {
				customer: d.fields_dict.customer.input.value,
				type: d.fields_dict.type.input.value,
				status: d.fields_dict.status.input.value
			};
			var columns = (["Link Name", "Customer", "Type", "Status"]);
			get_it_management_tables(frm, $results, $placeholder, method, args, columns);
		}
		d.fields_dict["type"].df.onchange = () => {
			var method = "it_management.utils.get_it_management_table";
			var args = {
				customer: d.fields_dict.customer.input.value,
				type: d.fields_dict.type.input.value,
				status: d.fields_dict.status.input.value
			};
			var columns = (["Link Name", "Customer", "Type", "Status"]);
			get_it_management_tables(frm, $results, $placeholder, method, args, columns);
		}
		d.fields_dict["status"].df.onchange = () => {
			var method = "it_management.utils.get_it_management_table";
			var args = {
				customer: d.fields_dict.customer.input.value,
				type: d.fields_dict.type.input.value,
				status: d.fields_dict.status.input.value
			};
			var columns = (["Link Name", "Customer", "Type", "Status"]);
			get_it_management_tables(frm, $results, $placeholder, method, args, columns);
		}
		
		
		$wrapper = d.fields_dict.result.$wrapper.append(`<div class="results"
			style="border: 1px solid #d1d8dd; border-radius: 3px; height: 300px; overflow: auto;"></div>`);
		$results = $wrapper.find('.results');
		$placeholder = $(`<div class="multiselect-empty-state">
					<span class="text-center" style="margin-top: -40px;">
						<i class="fa fa-2x fa-table text-extra-muted"></i>
						<p class="text-extra-muted">No IT Managementtable found</p>
					</span>
				</div>`);
		$results.on('click', '.list-item--head :checkbox', (e) => {
			$results.find('.list-item-container .list-row-check')
				.prop("checked", ($(e.target).is(':checked')));
		});
		$results.empty();
		$results.append($placeholder);
		set_primary_action(frm, d, $results);
		var method = "it_management.utils.get_it_management_table";
		var args = {
			customer: d.fields_dict.customer.input.value,
			type: d.fields_dict.type.input.value,
			status: d.fields_dict.status.input.value
		};
		var columns = (["Link Name", "Customer", "Type", "Status"]);
		get_it_management_tables(frm, $results, $placeholder, method, args, columns);
		d.show();
	}
});

function activity_dialog(frm) {
	if (frm.is_new()) {
		show_alert(__('Save the document first.'));
		return;
	}
	const activity = new frappe.ui.Dialog({
		title: __('New Activity'),
		fields: [
			{
				fieldtype: 'Datetime',
				label: __('From Time'),
				fieldname: 'from_time',
				default: frappe.datetime.now_datetime()
			},
			{
				fieldtype: 'Link',
				label: __('Activity Type'),
				fieldname: 'activity_type',
				options: 'Activity Type',
			},
			{
				fieldtype: 'Column Break',
				fieldname: 'cb_1',
			},
			{
				fieldtype: 'Datetime',
				fieldname: 'to_time',
				label: __('To Time'),
				default: frappe.datetime.now_datetime(),
			},
			// {
			// 	fieldtype: 'Float',
			// 	fieldname: 'hours',
			// 	label: __('Hours'),
			// 	default: 0.25
			// },
			{
				fieldtype: 'Section Break',
				fieldname: 'sb_1',
			},
			{
				fieldtype: 'Text Editor',
				fieldname: 'note',
			},
		],
	})

	activity.set_primary_action(__('Save'), (dialog) => {
		frm.timeline.insert_comment('Comment', dialog.note);
		const hours = moment(dialog.to_time).diff(moment(dialog.from_time), "seconds") / 3600;

		let timesheet = {
			doctype: 'Timesheet',
			issue: frm.doc.name,
			note: dialog.note,
			time_logs: [
				{
					activity_type: dialog.activity_type,
					from_time: dialog.from_time,
					to_time: dialog.to_time,
					// to_time: (new moment(dialog.from_time)).add(dialog.hours, 'hours').format('YYYY-MM-DD HH:mm:ss'),
					hours: hours,
					project: frm.doc.project,
					/* task: frm.doc.task, */
					billable: 1,
					billing_hours: hours,
				}
			],
			docstatus: 1
		};

		// Get employee for logged user
		const options = { user_id: frappe.session.user };
		const fields = ['name', 'company'];

		frappe.db.get_value('Employee', options, fields)
			.then(({ message: employee }) => {
				if (employee) {
					timesheet['employee'] = employee.name;
					timesheet['company'] = employee.company;
				}
			})
			.then(() => {
				frappe.db.insert(timesheet);
			})
			.then(() => {
				activity.hide();
				activity.clear();
			});
	})

	activity.show();
}


var set_primary_action= function(frm, dialog, $results) {
	var me = this;
	dialog.set_primary_action(__('Get IT Managementtable'), function() {
		let checked_values = get_checked_values($results);
		if(checked_values.length > 0){
			frm.set_value("it_management_table", []);
			add_to_item_line(frm, checked_values);
			dialog.hide();
		}
		else{
			frappe.msgprint(__("Please select IT Management Table to fetch"));
		}
	});
};

var get_it_management_tables = function(frm, $results, $placeholder, method, args, columns) {
	var me = this;
	$results.empty();
	frappe.call({
		method: method,
		args: args,
		callback: function(data) {
			if(data.message){
				$results.append(make_list_row(columns));
				for(let i=0; i<data.message.length; i++){
					$results.append(make_list_row(columns, data.message[i]));
				}
			}else {
				$results.append($placeholder);
			}
		}
	});
}

var make_list_row= function(columns, result={}) {
	var me = this;
	// Make a head row by default (if result not passed)
	let head = Object.keys(result).length === 0;
	let contents = ``;
	columns.forEach(function(column) {
		var column_value = '-';
		if (result[column]) {
			column_value = result[column];
		}
		contents += `<div class="list-item__content ellipsis">
			${
				head ? `<span class="ellipsis">${__(frappe.model.unscrub(column))}</span>`

				:(column !== "name" ? `<span class="ellipsis">${__(column_value)}</span>`
					: `<a class="list-id ellipsis">
						${__(result[column])}</a>`)
			}
		</div>`;
	})

	let $row = $(`<div class="list-item">
		<div class="list-item__content" style="flex: 0 0 10px;">
			<input type="checkbox" class="list-row-check" ${result.checked ? 'checked' : ''}>
		</div>
		${contents}
	</div>`);

	$row = list_row_data_items(head, $row, result);
	return $row;
};

var list_row_data_items = function(head, $row, result) {
	head ? $row.addClass('list-item--head')
		: $row = $(`<div class="list-item-container"
			data-reference= "${result.reference}"
			data-qty = ${result.quantity}
			data-description = "${result.description}">
			</div>`).append($row);
	return $row
};

var get_checked_values= function($results) {
	return $results.find('.list-item-container').map(function() {
		let checked_values = {};
		if ($(this).find('.list-row-check:checkbox:checked').length > 0 ) {
			checked_values['reference'] = $(this).attr('data-reference');
			return checked_values
		}
	}).get();
};

var add_to_item_line = function(frm, checked_values){
	for(let i=0; i<checked_values.length; i++){
		frappe.call({
			method: "it_management.utils.get_it_management_table_from_source",
			args: {
				'reference': checked_values[i].reference
			},
			callback: function(data) {
				if(data.message){
					for(let y=0; y<data.message.length; y++){
						var row_to_add_from_reference = data.message[y];
						var child = cur_frm.add_child('it_management_table');
						frappe.model.set_value(child.doctype, child.name, 'dynamic_type', row_to_add_from_reference.dynamic_type);
						frappe.model.set_value(child.doctype, child.name, 'dynamic_name', row_to_add_from_reference.dynamic_name);
						frappe.model.set_value(child.doctype, child.name, 'note', row_to_add_from_reference.note);
						frappe.model.set_value(child.doctype, child.name, 'checked', row_to_add_from_reference.checked);
						cur_frm.refresh_field('it_management_table');
					}
				}
			}
		});
	}
	frm.refresh_fields();
};