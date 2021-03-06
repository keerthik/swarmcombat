class OrdersController < ApplicationController
  before_filter :authenticate_user!, :except => [:index, :show]

  # GET /orders
  # GET /orders.json
  def index
    @orders = Order.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @orders }
    end
  end

  # GET /orders/1
  # GET /orders/1.json
  def show
    @order = Order.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @order }
    end
  end

  # GET /orders/new
  # GET /orders/new.json
  def new
    @order = Order.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @order }
    end
  end

  # GET /orders/1/edit
  def edit
    @order = Order.find(params[:id])
  end

  # POST /orders
  # POST /orders.json
  def create
    @existingorder = Order.find_by_content(params[:order][:content])
    if @existingorder != nil
      if @existingorder.nused != nil
        @existingorder.update_attributes(:nused => @existingorder.nused + 1)
      else
        @existingorder.update_attributes(:nused => 2)
      end
      respond_to do |format|
        if @existingorder.save
          format.html { redirect_to @existingorder, notice: 'Order was successfully created.' }
          format.json { render json: @existingorder, status: :created, location: @existingorder }
        else
          format.html { render action: "new" }
          format.json { render json: @existingorder.errors, status: :unprocessable_entity }
        end
      end
    else
      order_params = params[:order]
      order_params[:author] = current_user.username
      @order = Order.new(order_params)
      respond_to do |format|
        if @order.save
          format.html { redirect_to @order, notice: 'Order was successfully created.' }
          format.json { render json: @order, status: :created, location: @order }
        else
          format.html { render action: "new" }
          format.json { render json: @order.errors, status: :unprocessable_entity }
        end
      end
    end
  end

  # PUT /orders/1
  # PUT /orders/1.json
  def update
    @order = Order.find(params[:id])

    respond_to do |format|
      if @order.update_attributes(params[:order])
        format.html { redirect_to @order, notice: 'Order was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @order.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /orders/1
  # DELETE /orders/1.json
  def destroy
    @order = Order.find(params[:id])
    @order.destroy

    respond_to do |format|
      format.html { redirect_to orders_url }
      format.json { head :no_content }
    end
  end

  # For development only. Orders-sets should probably never be deleted
  def delete_all_orders
    Order.destroy_all 
    @orders = Order.all
    render 'index'
  end

end
