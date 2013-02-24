class AddMarkedCodeToGames < ActiveRecord::Migration
  def change
  	add_column :games, :marked_code0, :text
  	add_column :games, :marked_code1, :text
  end
end
