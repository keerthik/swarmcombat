class ChangeGamesCodeToText < ActiveRecord::Migration
  def change
  	remove_column :games, :code0
  	remove_column :games, :code1
  	add_column :games, :code0, :text
  	add_column :games, :code1, :text
  end
end
