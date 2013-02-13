class GamesController < ApplicationController
  before_filter :authenticate_user!, :except => [:index]

  def index
    @games = Game.all
  end

  def show
    @game = Game.find(params[:id])
    if (current_user.username != @game[:player0])
      if (@game[:player1] != nil and @game[:player1] != current_user.username) 
        # Something about illegal entry/watching only
      else
        # This is a player joining the empty slot
        @game[:player1] = current_user.username
      end
    else
      # Welcome player 0
    end
  end

  def new
    @game = Game.new
  end

  def create
    game_params = params[:game]
    game_params[:player0] = current_user.username
    @game = Game.new(game_params)
    if @game.save 
      redirect_to @game
    else
      render 'new'
    end
  end

  def validate_code(code)
    # DO SOMETHING TO MAKE SURE NO CHEATING
    return code
  end


  # Call made when a player is ready, returning opponent code when opponent's ready
  #  param[:pid] refers to whether the player sending this message is player0 or player1 in game
  def ready
    @game = Game.find(params[:id])
    pid = params[:pid].to_i;
    incode = params[:mycode]
    #TODO: Make this response contain values obtained from the game server, not these hardcoded ones
    if (pid == 0)
      if (current_user.username == @game[:player0])
        code0 = validate_code(incode);
        @game.code0 = code0
      else
        #Do something about unverified game
      end
    else
      if (current_user.username == @game[:player1])
        code1 = validate_code(incode);
        @game.code1 = code1
      else
        #Similarly, unverified game
      end
    end

    @response = {:ready => (@game.code0 != nil and @game.code1 != nil), :code0 => @game.code0, :code1 => @game.code1}
    respond_to do |format|    
      format.json { render json: @response.to_json }
    end

  end

  # For development only. Games should eventually be automatically deleted
  # if there are no active players (or moved into a replay repo.
  def delete_all_games
    Game.destroy_all 
    @games = Game.all
    render 'index'
  end
    
end
