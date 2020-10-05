/**
 * Ref: https://sequelize.org/v5/manual/data-types.html
 *
 * Store Item
 * note: item_remove_date means item stop from selling
 * note: created_at means created date of each item or row
 * note: updated_at means updated date of each item or row
 * note: remaining means amount of item remaining in stock
 *
 * 1 item with many code possible
 * 1 item with many promotion possible
 */
const Item = sequelize.define('Item', {
  item_id: Sequelize.INTEGER,
  item_name: Sequelize.STRING(127),
  item_description: Sequelize.STRING(511),
  item_prize: Sequelize.INTEGER,
  item_release_date: Sequelize.DATE,
  item_remove_date: Sequelize.DATE,
  remaining: Sequelize.INTEGER,
  created_at: Sequelize.DATE,
  updated_at: Sequelize.DATE,
});
Item.associate = (models) => {
  Item.hasMany(Code, { foreignKey: 'code_id' });
  Item.hasMany(Promotion, { foreignKey: 'promotion_id' });
};
Item.associate = (models) => {
  Item.belongsTo(Bundle, { foreignKey: 'item_id' });
};

/**
 * note:code is 1 time use
 */
const Code = sequelize.define('Code', {
  code_id: Sequelize.INTEGER,
  code_text: Sequelize.STRING(63),
  code_description: Sequelize.STRING(511),
  is_code_used: Sequelize.BOOLEAN,
  created_at: Sequelize.DATE,
});
Code.associate = (models) => {
  Code.belongsTo(Item, { foreignKey: 'code_id' });
};

const Promotion = sequelize.define('Promotion', {
  promotion_id: Sequelize.INTEGER,
  promotion_description: Sequelize.STRING(511),
  promotion_discount: Sequelize.INTEGER,
  promotion_start: Sequelize.DATE,
  promotion_end: Sequelize.DATE,
  created_at: Sequelize.DATE,
  updated_at: Sequelize.DATE,
});
Promotion.associate = (models) => {
  Promotion.belongsTo(Item, { foreignKey: 'promotion_id' });
};

/**
 * item may sale in bundle type
 * for example sale two difference character skin set in special price
 *    2 skins in list -> 1 set of bundle
 * or sale five gachapon box (for random item) in special price.
 *    1 gachapon box in list -> 5 sets of bundle
 *
 * 1 bundle with many items possible
 *
 * bundle_items is array of item_id
 */
const Bundle = sequelize.define('Bundle', {
  bundle_id: Sequelize.INTEGER,
  bundle_name: Sequelize.STRING(63),
  bundle_description: Sequelize.STRING(511),
  bundle_items: Sequelize.ARRAY(Sequelize.INTEGER),
  bundle_amount: Sequelize.INTEGER,
  bundle_prize: Sequelize.INTEGER,
  created_at: Sequelize.DATE,
  updated_at: Sequelize.DATE,
});
Bundle.associate = (models) => {
  Bundle.hasMany(Item, { foreignKey: 'item_id' });
};
