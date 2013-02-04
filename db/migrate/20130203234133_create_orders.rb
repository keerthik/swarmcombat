class CreateOrders < ActiveRecord::Migration
  def change
    create_table :orders do |t|
      t.string :name
      t.string :author
      t.string :content
      t.integer :nused, :default=> 1
      t.timestamps
    end
  end
end
