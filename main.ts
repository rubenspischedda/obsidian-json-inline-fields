import { Plugin } from "obsidian";

export default class JsonInlineFieldsPlugin extends Plugin {
	async onload() {
		app.workspace.trigger("parse-style-settings");

		this.registerMarkdownPostProcessor((el, ctx) => {
			if (
				el.parentElement?.classList?.contains(
					"inline-field-standalone-value"
				) ||
				el.parentElement?.classList?.contains("inline-field-value")
			) {
				const isStandalone = el.parentElement?.classList?.contains(
					"inline-field-standalone-value"
				);

				try {
					// Parse metadata value. If it's not a JSON, it will throw an error
					// and the default rendering will be used.
					let inlineFieldKey: string | undefined;

					if (!isStandalone) {
						inlineFieldKey =
							(
								el.parentElement?.parentElement?.querySelector(
									".inline-field-key"
								) as HTMLElement
							).getAttribute("data-dv-key") ?? undefined;
					}

					const inlineFieldValue = JSON.parse(el.innerText);
					
					this.addLinksToInlineFieldsValues(el, inlineFieldValue);

					// Create a container for the table(s)
					const container = this.createContainerElement();

					// If it's an array, create a table for each item, otherwise create a single table
					const values = [inlineFieldValue].flat();

					if (values.length > 1 && inlineFieldKey) {
						const titleElement = document.createElement("div");
						titleElement.innerText = inlineFieldKey;
						titleElement.addClass("json-inline-fields-title");
						container.appendChild(titleElement);
					}

					const tables: HTMLElement[] = [];

					values.forEach((item: any, index: number, array: any[]) => {
						const title =
							(array.length === 1 && inlineFieldKey) || undefined;
						const table = this.createTableElement(
							item,
							false,
							title
						);
						tables.push(table);
					});

					if (tables.length > 1) {
						const tablesContainer = document.createElement("div");
						tablesContainer.addClass(
							"json-inline-fields-tables-container"
						);
						tables.forEach((table) => {
							tablesContainer.appendChild(table);
						});
						container.appendChild(tablesContainer);
					} else {
						container.appendChild(tables[0]);
					}

					// Replace the standard inline field rendering
					if (!isStandalone) {
						const keyElement =
							el.parentElement?.parentElement?.querySelector(
								".inline-field-key"
							) as HTMLElement;

						el.parentElement?.parentElement?.removeChild(
							keyElement
						);
					}

					el.parentElement?.replaceWith(container);
				} catch (e) {
					// not a json
				}
			}
		});
	}

	addLinksToInlineFieldsValues(el: HTMLElement, inlineFieldValue: any) {
		//TODO: inject links to the inline field values
		return inlineFieldValue;
	}

	onunload() {}

	/**
	 * Creates a new container element
	 * @returns The newly created container element.
	 */
	createContainerElement(): HTMLElement {
		const container = document.createElement("div");
		container.addClass("json-inline-fields-container");
		return container;
	}

	/**
	 * Creates a new table element
	 * @returns The newly created table element.
	 */
	createTableElement(
		object: any,
		innerTable: boolean = false,
		title?: string
	): HTMLElement {
		const table = document.createElement("div");
		table.addClass("json-inline-fields-table");
		if (innerTable) {
			table.addClass("json-inline-fields-inner-table");
		}

		if (title) {
			const tableTitleContainer = document.createElement("div");
			tableTitleContainer.addClass(
				"json-inline-fields-table-title-container"
			);

			const tableTitle = document.createElement("div");
			tableTitle.addClass("json-inline-fields-table-title");
			tableTitle.innerText = title;

			tableTitleContainer.appendChild(tableTitle);
			table.appendChild(tableTitleContainer);
		}

		this.populateTable(table, object);
		return table;
	}

	/**
	 * Creates a new table row key element
	 * @param property The property to be used as the key.
	 * @returns The newly created table row key element.
	 */
	createRowKeyElement(property: any): HTMLElement {
		const rowKey = document.createElement("div");
		rowKey.classList.add("json-inline-fields-key");
		rowKey.innerText = property;
		return rowKey;
	}

	/**
	 * Creates a new table row value element
	 * @param object The whole object.
	 * @param property The property to get the value for.
	 */
	createRowValueElement(object: any, property: any): HTMLElement {
		const rowValue = document.createElement("div");
		rowValue.classList.add("json-inline-fields-value");

		if (Array.isArray(object[property])) {
			rowValue.classList.add("json-inline-fields-array");
			object[property].forEach((item: any) => {
				if (typeof item === "object" || Array.isArray(item)) {
					const table = this.createTableElement(item, true);
					rowValue.appendChild(table);
				} else {
					const rowArrayValue = document.createElement("div");
					rowArrayValue.classList.add(
						"json-inline-fields-array-value"
					);
					rowArrayValue.innerText = item;
					rowValue.appendChild(rowArrayValue);
				}
			});
		} else {
			if (typeof object[property] === "object") {
				const table = this.createTableElement(object[property], true);
				rowValue.appendChild(table);
			} else {
				rowValue.innerText = object[property];
			}
		}
		return rowValue;
	}

	/**
	 * Creates a new table row element
	 * @param object The whole object.
	 * @param property The property to create the row for.
	 * @returns The newly created table row element.
	 */
	createTableRowElement(object: any, property: any): { key: HTMLElement, value: HTMLElement } {
		// Create the row element
		// const rowElement = document.createElement("div");
		// rowElement.addClass("json-inline-fields-row");

		// Create the key element
		const rowKey = this.createRowKeyElement(property);

		// Create the value element
		const rowValue = this.createRowValueElement(object, property);

		// rowElement.appendChild(rowKey);
		// rowElement.appendChild(rowValue);

		return { key: rowKey, value: rowValue };
	}

	/**
	 * Populates the given table element with rows for each property in the given object.
	 * @param container The table element to populate.
	 * @param object The object to populate the table with.
	 */
	populateTable(container: HTMLElement, object: any) {
		for (const property in object) {
			const row = this.createTableRowElement(object, property);
			container.appendChild(row.key);
			container.appendChild(row.value);
		}
	}

	async loadSettings() {}

	async saveSettings() {}
}
