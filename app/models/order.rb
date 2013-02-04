class Order < ActiveRecord::Base
  attr_accessible :author, :content, :name, :nused
end
