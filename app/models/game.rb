class Game < ActiveRecord::Base
  validates_presence_of :name
  validates_uniqueness_of :name 

  attr_accessible :name
end
