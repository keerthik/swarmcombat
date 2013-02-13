class CreateGames < ActiveRecord::Migration
  def change
    create_table :games do |t|
      t.string	:name
      t.string	:player0
      t.string	:code0
      t.string	:player1
      t.string	:code1
      t.timestamps
    end
  end
end
