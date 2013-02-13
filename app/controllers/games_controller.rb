class GamesController < ApplicationController
  before_filter :authenticate_user!, :except => [:index]

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
  def ready
    @game = Game.find(params[:id])
    pid = params[:pid].to_i;
    incode = params[:mycode]
    #TODO: Make this response contain values obtained from the game server, not these hardcoded ones
    if (pid == 0)
      if (current_user.username == @game[:player0])
        code0 = validate_code(incode);
        code1 = "data.facing -= 0.05;"
      else
        #Do something about unverified game
      end
    else
      if (current_user.username == @game[:player1])
        code0 = "data.facing -= 0.05;"
        code1 = validate_code(incode);
      else
        #unverified game
      end
    end

    @response = {:ready => true, :code0 => code0, :code1 => code1}
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
