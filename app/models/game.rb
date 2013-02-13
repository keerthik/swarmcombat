class Game < ActiveRecord::Base
  validates_presence_of :name
  validates_uniqueness_of :name 

  attr_accessible :name, :player0, :player1, :code0, :code1
end
