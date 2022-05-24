//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
	"mongodb+srv://fester:B5PK5Pm2TQBg0LH4@cluster0.urtjh.mongodb.net/todolistzzDB"
);

const itemsSchema = {
	name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Cook Food" });
const item2 = new Item({ name: "Take a Walk" });
const item3 = new Item({ name: "Check box to delete Item" });
const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
	Item.find({}, function (err, foundItems) {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Successfully Saved!");
				}
			});
			res.redirect("/");
		} else {
			res.render("list", {
				listTitle: "Today",
				newListItems: foundItems,
			});
		}
	});
});

app.get("/:customListName", function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				//Create a new List
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect("/" + customListName);
			} else {
				//Show an existing List
				res.render("list", {
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		}
	});
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;
	const item = new Item({ name: itemName });

	if (listName === "Today") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
});

app.post("/delete", function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (!err) {
				res.redirect("/");
			}
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } },
			function (err, stat) {
				if (!err) {
					res.redirect("/" + listName);
				}
			}
		);
	}
});

app.get("/work", function (req, res) {
	res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
	res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = "3000";
}

app.listen(port, function () {
	console.log("Server has started sucessfully");
});
