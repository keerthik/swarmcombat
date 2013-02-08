class GamesController < ApplicationController
  def index
    @games = Game.all
  end

  def show
    @game = Game.find(params[:id])
  end

  def new
    @game = Game.new
  end

  def create
    @game = Game.new(params[:game])
    if @game.save 
      redirect_to @game
    else
      render 'new'
    end
  end

  def ready
    @game = Game.find(params[:id])
    @pid = params[:pid]
    #TODO: Make this response contain values obtained from the game server, not these hardcoded ones
    @response = {:ready => true, :code0 => "data.facing += 0.05;", :code1 => "data.facing -= 0.05;"}
    respond_to do |format|    
      format.json { render json: @response.to_json }
    end

  end

  # For development only. Games should eventually be automatically deleted
  # if there are no active players.
  def delete_all_games
    Game.destroy_all 
    @games = Game.all
    render 'index'
  end
    
end
