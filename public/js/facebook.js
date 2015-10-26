function checkLoginState (){
	FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
}
function statusChangeCallback(response){
	console.log(response);
    // The response object is returned with a status field that lets the app know the current login status of the person
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      testAPI();
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      document.getElementById('status').innerHTML = 'Please log into this app.';
    } else {
      // The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
      document.getElementById('status').innerHTML = 'Please log into Facebook.';
    }
}
window.fbAsyncInit = function() {//will run as soon as SDK has finished loading
    FB.init({//intiaze the setup sdk
    	cookie   : true,//if enables the cookie can be used by web server
      	appId      : '********************',//Obtain Your own API key from facebook developers
        xfbml      : true,//extended Fb Markup Langugae...intialize any fb plugin used in page using DOM
      	version    : 'v2.5',
      	status : true
    });//can add more in javascript ..any code that you want to be run after SDK is loaded is placed here
    FB.getLoginStatus(function(response) {
    	statusChangeCallback(response);
  	});
};
function testAPI()
{
  document.getElementById('fb').style.display='none';
  document.getElementById('random').innerHTML=":)";
	//window.location.reload();
  if(!$.cookie("userId")){
    FB.api('/me',function(response){
     var userId=response.id;
     $.ajax({
        type: "POST",
        url: '/findIfId',
        data: response,
        success: function(res){
          console.log(res);
          FB.api('/me/friends',function(resposeFriends){
            if( resposeFriends.data.length<=0 )
            {
              alert('You have no friend as of now on this platform!Invite them');
              return ;
            }
            resposeFriends.id=userId;
              $.ajax({
                  type:"POST",
                  url:"addFriends",
                  data:resposeFriends,
                  success:function(resposeFriendsAjax)
                  {
                    FB.api('/me/tagged_places',function(responsePlaces){
                      responsePlaces.userId=userId;
                      console.log(responsePlaces);
                      $.ajax({
                        type:"POST",
                        url:"addTaggedPlaces",
                        data:responsePlaces,
                        success:function(responsePlacesAjax)
                        {
                          console.log(responsePlacesAjax);
                          
                        }
                      });
                    })
                    // FB.api('/me/tagged_places',function(responsePlaces){
                    //   responsePlaces.userId=userId;
                    //   console.log(responsePlaces);
                    //   $.ajax({
                    //     type:"POST",
                    //     url:"addTaggedPlaces",
                    //     data:responsePlaces,
                    //     success:function(responsePlacesAjax)
                    //     {
                    //
                    //     }
                    //   });
                    // })
                  }
                });
            });
        }
     });
  });
  }
	
	
}
