// This class handles mock requests for UI5 releases 1.28 or older, 
// before attachAfter/atachBefore was introduced.
// for UI5 releases 1.30 and higher, check MockRequests.js
//
// In mock mode, the mock server intercepts HTTP calls and provides fake output to the
// client without involving a backend system. But special backend logic, such as that
// performed by function imports, is not automatically known to the mock server. To handle
// such cases, the app needs to define specific mock requests that simulate the backend
// logic using standard HTTP requests (that are again interpreted by the mock server) as
// shown below.

// Please note:
// The usage of synchronous calls is only allowed in this context because the requests are
// handled by a latency-free client-side mock server. In production coding, asynchronous
// calls are mandatory.

sap.ui.define(["sap/ui/base/Object"], function(Object) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.shop.localService.MockRequestsV128", {
		constructor: function(oMockServer) {
			this._oMockServer = oMockServer;
		},

		getRequests: function() {
			// This method is called by the webIDE if the app is started in mock mode with the
			// option "AddCustom Mock Requests". It returns the list of app specific mock requests.
			// The list is added to the mock server's own list of requests

			return [
				this._mockAddProductToShoppingCart(),
				this._mockBuyShoppingCart(),
				this._mockDeleteItem(),
				this._mockRateAsHelpful(),
				this._mockWriteAReview(),
				this._mockChangeItemQuantity(),
				this._mockDeleteAReview(),
				this._mockChangeAReview()
			];
		},

		_mockAddProductToShoppingCart: function() {
			return {
				// This mock request handles the "AddProductToShoppingCart" function
				// The following steps are performed:
				// - Create a shopping cart for the user if none exists yet. This is
				// not done here because the built-in mock data already contains a
				// shopping cart.
				// - Update the total quantity property of the shopping cart
				// - Create a new shopping cart item if there is no item yet that
				// contains the added product. If such an
				// item already exists, update its quantity and value accordingly.
				method: "POST",
				path: new RegExp("AddProductToShoppingCart\\?ProductId=(.*)"),
				response: function(oXhr, sUrlProductId) {
					var oShoppingCart = this._oMockServer.getEntitySetData("ShoppingCarts")[0],
						aShoppingCartItems = this._oMockServer.getEntitySetData("ShoppingCartItems"),
						oShoppingCartItem = null,
						sProductId = decodeURIComponent(sUrlProductId),
						sId = this._getNewItemId(aShoppingCartItems);

					sProductId = sProductId.substring(1, sProductId.length - 1);

					// check if there is already a shopping cart item for this product.
					oShoppingCartItem = this._findFirst("ProductId", sProductId, aShoppingCartItems);
					if (oShoppingCartItem) {
						sId = oShoppingCartItem.Id;
						// there is already an item for this product -> just increase the quantity and the subtotal of this item and update the totals on the shopping cart accordingly
						oShoppingCartItem.SubTotal = (oShoppingCartItem.SubTotal / oShoppingCartItem.Quantity) * (oShoppingCartItem.Quantity + 1);
						oShoppingCartItem.Quantity++;
						oShoppingCart.Total = +oShoppingCart.Total + (oShoppingCartItem.SubTotal / oShoppingCartItem.Quantity);
						// update the Shopping Cart Item with the new quantity
						aShoppingCartItems[this._indexOfObject("ProductId", sProductId, aShoppingCartItems)] = oShoppingCartItem;
						this._oMockServer.setEntitySetData("ShoppingCartItems", aShoppingCartItems);
					} else {
						// There is no item for this product in the cart yet -> create one, the necessary data can be found in the product
						var aProducts = this._oMockServer.getEntitySetData("Products"),
							oProduct = this._findFirst("Id", sProductId, aProducts);

						oShoppingCartItem = {
							Id: sId,
							ProductId: oProduct.Id,
							CurrencyCode: oProduct.CurrencyCode,
							Quantity: 1,
							ShoppingCartId: -1,
							SubTotal: oProduct.Price,
							Unit: oProduct.QuantityUnit,
							"__metadata": {
								"id": this._oMockServer.getRootUri() + "ShoppingCartItems" + "('" + sId + "')",
								"uri": this._oMockServer.getRootUri() + "ShoppingCartItems" + "('" + sId + "')",
								"type": "EPM_REF_APPS_SHOP.ShoppingCartItem"
							},
							Product: {
								__deferred: {
									uri: this._oMockServer.getRootUri() + "ShoppingCartItems" + "('" + sId + "')/" + "Product"
								}
							}
						};
						// create a Shopping Cart Item for the selected product 
						aShoppingCartItems.push(oShoppingCartItem);
						this._oMockServer.setEntitySetData("ShoppingCartItems", aShoppingCartItems);
						// Update the new total value on the shopping cart
						oShoppingCart.Total = +oShoppingCart.Total + +oShoppingCartItem.SubTotal;
					}

					// // Update the new total quantity on the shopping cart
					oShoppingCart.TotalQuantity = +oShoppingCart.TotalQuantity + 1;

					// update the shopping cart totals
					this._oMockServer.setEntitySetData("ShoppingCarts", [oShoppingCart]);

					//finally read the just updated/created item in order to get the correct response for the oXhr object
					var aUpdatedItems = this._oMockServer.getEntitySetData("ShoppingCartItems"),
						oUpdatedItem = this._findFirst("Id", sId, aUpdatedItems);

					oXhr.respondJSON(200, {}, JSON.stringify({
						d: oUpdatedItem
					}));
					return true;
				}.bind(this)
			};
		},

		_mockBuyShoppingCart: function() {
			return {
				// This mock request simulates the function import "BuyShoppingCart",
				// which is triggered when the "Buy Now" button is chosen on the
				// Checkout view.
				// It removes all items from the shopping cart and sets the totals on
				// the shopping cart to 0.
				method: "POST",
				path: new RegExp("BuyShoppingCart"),
				response: function(oXhr) {
					var oNewShoppingCartData = null;

					// Get shopping cart
					oNewShoppingCartData = this._oMockServer.getEntitySetData("ShoppingCarts")[0];
					oNewShoppingCartData.Total = "0";
					oNewShoppingCartData.TotalQuantity = "0";
					this._oMockServer.setEntitySetData("ShoppingCarts", [oNewShoppingCartData]);

					// Delete all shopping cart items
					this._oMockServer.setEntitySetData("ShoppingCartItems", []);
					oXhr.respondJSON(200, {}, JSON.stringify({
						d: []
					}));

					return true;
				}.bind(this)
			};
		},

		_mockDeleteItem: function() {
			// This mock request updates the totals on the shopping cart when a
			// shopping cart item is deleted. This
			// is necessary because the the calculation of the totals and the update
			// of the shopping cart is not
			// directly triggered by a http request. Instead the back end does it
			// automatically during the
			// processing of a http delete request for a shopping cart item
			var oMockRequest = this._calcCartTotalsFromItems();
			oMockRequest.method = "DELETE";
			return oMockRequest;
		},

		_mockChangeItemQuantity: function() {
			// This mock request updates the totals on the shopping cart when the
			// quantity field in of a shopping cart item is manually changed. This
			// is necessary because the the calculation of the totals and the update
			// of the shopping cart is not directly triggered by a http request.
			// Instead the back end does it automatically during the processing of a
			// http merge request for a shopping cart item
			var oMockRequest = this._calcCartTotalsFromItems();
			oMockRequest.method = "MERGE";
			return oMockRequest;
		},

		_mockWriteAReview: function() {
			// This mock request is used when the a review is created.
			// The following actions are performed:
			// for Product:
			// - set HasReviewOfCurrentUser indicator to true
			// - calculate and set the new average rating
			// - increase the RatingCount 1
			// for ReviewAggregation:
			// - increase the counter corresponding to the new rating by 1
			// for Review
			// - replace the dummy id with a correct Id
			// - complete the review data
			return {
				method: "POST",
				path: new RegExp("Reviews"),
				response: function(oXhr) {
					var oDate = new Date(), // needed to create time stamp for the new review,
						aProducts = this._oMockServer.getEntitySetData("Products"),
						oProduct = null,
						aReviews = this._oMockServer.getEntitySetData("Reviews"),
						rNewReviewId = new RegExp("guid\'........-....-....-....-............\'"),
						sNewReviewId = oXhr.responseText.match(rNewReviewId)[0].substring(5, 41),
						oNewReview = this._findFirst("Id", sNewReviewId, aReviews);

					//Get the reviewed product and update it according to the review
					oProduct = this._findFirst("Id", oNewReview.ProductId, aProducts);
					oProduct.bHasOwnReview = true;
					oProduct.AverageRating = (oProduct.AverageRating * oProduct.RatingCount + oNewReview.Rating) / (oProduct.RatingCount + 1);
					oProduct.RatingCount++;
					this._oMockServer.setEntitySetData("Products", aProducts);

					//update the ReviewAggregates entity set 
					var aReviewAggregates = this._oMockServer.getEntitySetData("ReviewAggregates"),
						aReviewAggregatesProduct = this._find("ProductId", oNewReview.ProductId, aReviewAggregates),
						oReviewAggregate = this._findFirst("Rating", oNewReview.Rating, aReviewAggregatesProduct);
					oReviewAggregate.RatingCount++;
					this._oMockServer.setEntitySetData("ReviewAggregates", aReviewAggregates);

					// new reviews are not automatically created with all needed data - fill the gaps
					oNewReview.ChangedAt = "\/Date(" + oDate.getTime() + ")\/";
					oNewReview.HelpfulCount = 0;
					oNewReview.HelpfulForCurrentUser = false;
					oNewReview.IsReviewOfCurrentUser = true;
					oNewReview.UserDisplayName = "Test User";

					this._oMockServer.setEntitySetData("Reviews", aReviews);
					oXhr.respondJSON(200, {}, JSON.stringify({
						d: oNewReview
					}));
					return true;

				}.bind(this)
			};
		},

		_mockDeleteAReview: function() {
			// The following actions need to be performed by the mock request function when a review
			// is deleted:
			// - update the RatingCount, the AverageRating and HasReviewOfCurrentUser of the product
			// - update the RatingCount of the ReviewAggregate
			// since the content of the deleted review is not known anymore it is not possible to tell
			// what product and what ReviewAggregate need updates. Therefore the values have to be
			// recalculated for all products and all ReviewAggregates
			return {
				method: "DELETE",
				path: new RegExp("Reviews(.*)"),
				response: function(oXhr) {
					var i = 0,
						j = 0,
						ratingIndex = 0,
						sProductId = null,
						aReviewSummaryForProd = null,
						aProducts = this._oMockServer.getEntitySetData("Products"),
						aReviewAggregates = this._oMockServer.getEntitySetData("ReviewAggregates"),
						aReviewAggregatesForProduct = {};

					// _getReviewSummaryForProduct for each Product
					while (i < aProducts.length) {
						sProductId = aProducts[i].Id;
						aReviewSummaryForProd = this._getReviewSummaryForProduct(sProductId, "");

						// update the product with the data
						aProducts[i].RatingCount = aReviewSummaryForProd.oReviewSummary.iRatingForProductCount;
						aProducts[i].AverageRating = aReviewSummaryForProd.oReviewSummary.fAverageRating;
						aProducts[i].HasReviewOfCurrentUser = false;

						// update the ReviewAggregate
						aReviewAggregatesForProduct = this._find("ProductId", sProductId, aReviewAggregates, false);
						j = 0; // reset counter
						// There are 5 rating data sets per material (1-5 Stars)
						while (j < 5) {
							// the review summary sorts the rating data sets ascending but aReviewAggregatesForProduct is not 
							// sorted but we know that there is one dataset for every possible rating -> therefore the value of
							// aReviewAggregatesForProduct[j].Rating -1 is the index of the related aReviewAggregatesForProduct entry
							ratingIndex = aReviewAggregatesForProduct[j].Rating - 1;
							aReviewAggregatesForProduct[j].RatingCount = aReviewSummaryForProd.oReviewSummary.aReviewAggregate[ratingIndex];
							j++;
						}
						i++;
						this._oMockServer.setEntitySetData("ReviewAggregates", aReviewAggregates);
					}
					this._oMockServer.setEntitySetData("Products", aProducts);
					oXhr.respondJSON(204);
					return true;
				}.bind(this)
			};
		},

		_mockChangeAReview: function() {
			// This mock request is used when the a review is changed.
			// The following actions are performed:
			// for Product:
			// - calculate and set the new average rating
			// for ReviewAggregation:
			// - update the number of ratings ()
			return {
				method: "MERGE",
				path: new RegExp("Reviews(.*)"),
				// path : new RegExp("Reviews"),
				response: function(oXhr, sUrlRatingGuid) {
					var oRating = {},
						ratingIndex = 0,
						sProductId = "",
						oReviewSummary = {},
						oProducts = {},
						aRatings = this._oMockServer.getEntitySetData("Reviews"),
						aProducts = this._oMockServer.getEntitySetData("Products"),
						aReviewAggregates = this._oMockServer.getEntitySetData("ReviewAggregates"),
						sRatingGuid = decodeURIComponent(sUrlRatingGuid),
						aReviewAggregatesForProduct = {};

					//based on method and path changeReview and rateAsHelpful look identical
					//check if this is really a "ChangeAReview" request and return if not
					if (!this._getRequestBody(oXhr).IsReviewOfCurrentUser) {
						return false;
					}

					// get the product id of the changed rating
					sRatingGuid = sRatingGuid.substring(6, 42);
					oRating = this._findFirst("Id", sRatingGuid, aRatings);
					sProductId = oRating.ProductId;

					// evaluate all ratings for the product in order to get the new average rating
					oReviewSummary = this._getReviewSummaryForProduct(sProductId, "");
					oProducts = this._findFirst("Id", sProductId, aProducts);
					aReviewAggregatesForProduct = this._find("ProductId", sProductId, aReviewAggregates, false);

					//update review aggregates
					for (var j = 0; j < 5; j++) {
						// the review summary sorts the rating data sets ascending but aReviewAggregatesForProduct is not 
						// sorted but we know that there is one dataset for every possible rating -> therefore the value of
						// aReviewAggregatesForProduct[j].Rating -1 is the index of the related aReviewAggregatesForProduct entry
						ratingIndex = aReviewAggregatesForProduct[j].Rating - 1;
						aReviewAggregatesForProduct[j].RatingCount = oReviewSummary.oReviewSummary.aReviewAggregate[ratingIndex];
						j++;
					}

					// Update the Product with the data of the new rating
					oProducts.AverageRating = oReviewSummary.oReviewSummary.fAverageRating;
					this._oMockServer.setEntitySetData("Products", aProducts);
					this._oMockServer.setEntitySetData("ReviewAggregates", aReviewAggregates);

					oXhr.respondJSON(204);

					return true;
				}.bind(this)
			};
		},

		_mockRateAsHelpful: function() {
			// This mock request is used when the "Rate as Helpful" button of a review
			// is pressed. It increases the "Helpful" count of the review by 1 and sets
			// the HelpfulForCurrentUser indicator to true
			return {
				method: "MERGE",
				path: new RegExp("Reviews(.*)"),
				response: function(oXhr) {
					var oReview = this._getRequestBody(oXhr),
						aReviews = this._oMockServer.getEntitySetData("Reviews"), //get the complete review data from the mock server
						oReviewFull = this._findFirst("Id", oReview.Id, aReviews);

					//check if this is really a "RateAsHelpful" request and return if not
					if (!oReview.HelpfulForCurrentUser) {
						return;
					}

					//Update the Review with the new helpful count and flag the review as "HelpfulForCurrentUser"
					oReview = oReviewFull;
					oReview.HelpfulCount++;
					oReview.HelpfulForCurrentUser = true;
					this._oMockServer.setEntitySetData("Reviews", aReviews);

					oXhr.respondJSON(204);
				}.bind(this)
			};
		},

		_getReviewSummaryForProduct: function(sProductId, sNewReviewId) {
			// This method is used to collect data from all reviews or for reviews of a given product.
			// sProductId is the product to collect the data for
			// An object containing the following data is returned:
			//		fAverageRating - the average rating for the product
			//		iRatingForProductCount - the number of existing ratings for the product
			//		oNewReview - the data of a newly created review (with Id = "0") or null if no new
			//                      review exists
			//		aReviewAggregate - array with 5 elements, the first element contains the number
			//                      of ratings with one star, the second one the number of ratings with 2 stars, ...
			var i = 0,
				iRatingSum = 0,
				oReview = {},
				aReviews = this._oMockServer.getEntitySetData("Reviews"),
				oReviewSummary = {
					fAverageRating: 0,
					iRatingForProductCount: 0,
					oNewReview: null,
					aReviewAggregate: [0, 0, 0, 0, 0]
				};

			//  evaluate the reviews for the given product in order to calculate the new average rating + ratingCount
			oReview = this._find("ProductId", sProductId, aReviews, false);

			// loop through all reviews to:
			// - find the new review
			// - calculate the new average rating
			// - collect the ratings for sProductId to build the ReviewAggregate object
			for (i = 0; i < oReview.length; i++) {
				if (sProductId === oReview[i].ProductId) {
					iRatingSum = iRatingSum + oReview[i].Rating;
					oReviewSummary.iRatingForProductCount++;
					oReviewSummary.aReviewAggregate[oReview[i].Rating - 1]++;
				}
				// newly created reviews have an intermediate key that does not contain yet the "-" of the a guid
				if (sNewReviewId && oReview[i].Id === sNewReviewId) {
					oReviewSummary.oNewReview = oReview[i];
				}
			}
			if (oReviewSummary.iRatingForProductCount === 0) {
				oReviewSummary.fAverageRating = 0;
			} else {
				oReviewSummary.fAverageRating = iRatingSum / oReviewSummary.iRatingForProductCount;
			}

			return {
				oReviewSummary: oReviewSummary
			};
		},

		_calcCartTotalsFromItems: function() {
			// In this mock function request the total on the shopping cart are updated
			// by adding up the the values of the shopping cart items. The http method
			// is not yet defined because the same logic is needed for "MERGE" and
			// "DELETE" calls. See function "mockDeleteItem" and
			// "mockChangeItemQuantity"
			return {
				path: new RegExp("ShoppingCartItems(.*)"),
				response: function(oXhr, sUrlShoppingCartItemId) {
					var i = 0,
						fTotalValue = 0,
						fTotalQuantity = 0,
						oShoppingCart = null,
						oProduct = null,
						oItem = null,
						sShoppingCartItemId = decodeURIComponent(sUrlShoppingCartItemId),
						aShoppingCartItems = this._oMockServer.getEntitySetData("ShoppingCartItems"),
						aProducts = this._oMockServer.getEntitySetData("Products");

					sShoppingCartItemId = sShoppingCartItemId.substring(2, sShoppingCartItemId.length - 2);

					// the quantity of an item was changed - first adopt the items's value to the new quantity
					if (oXhr.method === "MERGE") {
						// get the item's data
						oItem = this._findFirst("Id", sShoppingCartItemId, aShoppingCartItems);

						// read the items's product to get the value per piece
						oProduct = this._findFirst("Id", oItem.ProductId, aProducts);

						// calculate the new subvalue and set it on the item
						oItem.SubTotal = (+oProduct.Price * oItem.Quantity).toString();

						//update the item with the new value
						this._oMockServer.setEntitySetData("ShoppingCartItems", aShoppingCartItems);
					}

					// Get shopping cart items
					// Use the remaining items to add up the totals
					if (aShoppingCartItems) {
						for (i = 0; i < aShoppingCartItems.length; i++) {
							fTotalValue = fTotalValue + +aShoppingCartItems[i].SubTotal;
							fTotalQuantity = fTotalQuantity + +aShoppingCartItems[i].Quantity;
						}
					} else {
						// There is no item left so the totals are 0
						fTotalValue = 0;
						fTotalQuantity = 0;
					}

					// Get shopping cart
					oShoppingCart = this._oMockServer.getEntitySetData("ShoppingCarts")[0];
					oShoppingCart.Total = fTotalValue.toString();
					oShoppingCart.TotalQuantity = fTotalQuantity.toString();

					this._oMockServer.setEntitySetData("ShoppingCarts", [oShoppingCart]);

					oXhr.respondJSON(204);

					return true;
				}.bind(this)
			};
		},

		_find: function(sAttribute, value, aSearchList, bLeaveEarly) {
			// Searches in an array of objects for a given attribute value and returns all matching objecsts in an array.
			// If bLeaveEarly is set to true only the first match will be returned
			var aResult = [];
			for (var i = 0; i < aSearchList.length; i++) {
				if (aSearchList[i][sAttribute] === value) {
					aResult.push(aSearchList[i]);
				}
				if (aResult.length === 1 && bLeaveEarly) {
					break;
				}
			}
			return aResult;
		},

		_findFirst: function(sAttribute, value, aSearchList) {
			// Searches in an array of objects for a given attribute value and returns the first match.
			var aMatches = this._find(sAttribute, value, aSearchList, true);
			if (aMatches.length > 0) {
				return aMatches[0];
			}
			return null;
		},

		_getNewItemId: function(aExistingItems) {
			// Creates a new Id as a string
			// aIdsInUse -  is a mandatory import parameter - it contains the already
			//              existing shopping cat items - their Ids need to be excluded
			// returns a new Id as astring
			var sNewId = null,
				iItemCount = aExistingItems.length;

			while (sNewId === null) {
				sNewId = ((iItemCount + 1) * 10).toString();
				if (this._findFirst("Id", sNewId, aExistingItems)) {
					sNewId = null;
					iItemCount++;
				}
			}
			return sNewId;
		},

		_indexOfObject: function(sAttribute, searchValue, aSearchList) {
			// Searches in an array of objects for a given attribute value and returns the index of the first matching object
			for (var i = 0; i < aSearchList.length; i++) {
				if (aSearchList[i][sAttribute] === searchValue) {
					return i;
				}
			}
			return -1;
		},

		_getRequestBody: function(oXhr) {
			// returns the request body as a Json object
			var oXhrModel = new sap.ui.model.json.JSONModel();
			oXhrModel.setJSON(oXhr.requestBody);
			return oXhrModel.getData();
		}
	});
});