const url='https://api.spotify.com/v1';
let http = new XMLHttpRequest();
/*********
 auth
 */
var redirect_uri = "http://192.168.2.102:8000/index.html";
var client_id = "aa92b0ba40024104951494af74eb5de2";
var client_secret = "f0f8071f443146569375fab8add89f75";
const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";

function onPageload(){
    handleRedirect()
    // setInterval(function () {
    //     let body = "grant_type=refresh_token";
    //     body += "&refresh_token=" + refresh_token;
    //     body += "&client_id=" + client_id;
    //     callAuthorizationApi(body);
    // }, 3600);
}
function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri);
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url;
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}
function callAuthorizationApi(body){
    let http = new XMLHttpRequest();

    http.open("POST", TOKEN, true);
    http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    http.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    http.send(body);
    http.onreadystatechange = function () {
        if (http.readyState === 4){
            console.log(JSON.parse(this.responseText).access_token);
            var access_token = JSON.parse(this.responseText).access_token;
            if(access_token != undefined){
                document.cookie = "token ="+access_token;
            }
            start();
        }
    }
}

/********
 * Custom
 */

function loadSidebarPlaylists(){
    http.open("GET", url+"/users/4wdntrvy8esurbx6urb1rafea/playlists");
    http.setRequestHeader("Accept", "application/json");
    http.setRequestHeader("Authorization", "Bearer "+getToken());
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            let playlists = JSON.parse(this.responseText);

            playlists.items.forEach( function (user){
                let li = document.createElement("li");
                let a = document.createElement('a');
                a.href = "playlist.html?id="+user.id;
                a.appendChild(li)
                if(user.name.length > 39)
                    li.innerText = user.name.slice(0,39).concat('...');
                else
                    li.innerText = user.name;
                document.getElementsByClassName('list-items')[0].appendChild(a);
            });
        }};
    http.send();
}

function featured_playlists () {
    $.ajax({
        url: url + '/browse/featured-playlists',
        type: 'GET',
        dataType: 'json',
        headers: {
            "Authorization": "Bearer " + getToken(),
        },
        success: function (response){
            var media = window.matchMedia("(max-width: 768px)")
            for (let i = 0; i < 7; i++) {
                $('#main-card').children('a')[i].href = 'playlist.html?id='+response.playlists.items[i].id;
                let span = $('#main-card').children().children().children().children('span')[i];
                if (media.matches){
                    if(response.playlists.items[i].name.length > 16)
                        $(span).text(response.playlists.items[i].name.slice(0,13).concat('...'));
                }else
                    $(span).text(response.playlists.items[i].name);
                let imgs = $('#main-card').children().children().children().children('img')[i];
                $(imgs).attr('src', response.playlists.items[i].images[0].url);
            }
        }
    });
}

function loadTrending (category,id) {
    $.ajax({
        url: url + '/browse/categories/'+id+'/playlists',
        type: 'GET',
        dataType: 'json',
        headers: {
            "Authorization": "Bearer " + getToken(),
        },
        success: function (response){
            for (let i = 0; i < 8; i++) {
                $('.vertical-card-holder'+'.'+category).children('a')[i].href = 'playlist.html?id='+response.playlists.items[i].id;
                let title = $('.'+category).children().children().children('.vertical-card-title')[i];
                $(title).text(response.playlists.items[i].name);
                let description = $('.'+ category).children().children().children('.vertical-card-subtitle')[i];
                if(response.playlists.items[i].description.length > 30)
                    $(description).text(response.playlists.items[i].description.slice(0,30).concat('...'));
                else
                    $(description).text(response.playlists.items[i].description);
                let imgs = $('.'+category).children().children().children('img')[i];
                 $(imgs).attr('src', response.playlists.items[i].images[0].url);
            }
        }
    });
}
function loadPlaylist() {
    loadSidebarPlaylists();
    const urlparams = new URLSearchParams(window.location.search);
    let id = urlparams.get('id');
    $.ajax({
        url: url + '/playlists/'+id,
        type: 'GET',
        dataType: 'json',
        headers: {
            "Authorization": "Bearer " + getToken(),
        },
        success: function (response){
            console.log(response);
            $(".playlist-title").text(response.name);
            $(".playlist-header").children('img').attr('src',response.images[0].url );
            $(".playlist-info").children().text(response.owner.display_name);
            for (let i = 0; i < response.tracks.items.length; i++) {
                var newRow = $("<tr>");
                let date_added = response.tracks.items[i].added_at.slice(0,10);
                let time = millsecondsToMinutes(response.tracks.items[i].track.duration_ms);
                let albumImg = response.tracks.items[i].track.album.images[2].url;
                let trackName ="";
                if(response.tracks.items[i].track.name.length > 40)
                    trackName = response.tracks.items[i].track.name.slice(0,37).concat('...');
                else
                    trackName = response.tracks.items[i].track.name;
                 let albumName = "";
                if(response.tracks.items[i].track.album.name.length > 40)
                    albumName = response.tracks.items[i].track.album.name.slice(0,37).concat('...');
                else
                    albumName = response.tracks.items[i].track.album.name;
                let artistName= response.tracks.items[i].track.artists[0].name.slice(0,36);
                var cols =
                    `<th scope="row" class="t-white pt-4">${i+1}</th>
                                        <td>
                                          <div class="playlist-table-title" style="display: flex">
                                            <img src=${albumImg} width="40px" alt="">
                                            <div class="playlist-table"> 
                                              <span class="t-white text-bold">${trackName}</span>
                                              <span style="font-size: 12px" class="t-white">${artistName}</span>
                                            </div>
                                          </div>
                                        </td>
                                        <td class="t-white album f-14">${albumName}</td>
                                        <td class="t-white date-added f-14">${date_added}</td>
                                        <td class="t-white time f-14">${time}</td>`;
                newRow.append(cols);
                $('.table').append(newRow);
            }
        }
    });

    function millsecondsToMinutes(ms) {
        mins = Math.floor((ms/1000/60) << 0);
        secs = Math.floor((ms/1000) % 60);
        return mins+":"+secs;
    }
    function returnArtists(artistsarr) {
        var artistsStr;
        console.log(artistsarr.length)
        artistsarr.forEach(function (artist){
            // artistsStr += artist.name +", ";
            console.log(artist.name)
        });
        return artistsStr
    }
}
 function displayMenu() {
     if($('.nav-container').css('left') == '-290px'){
         $('.nav-container').css('left','0');
     }else{
         $('.nav-container').css('left','-290');
     }
 }
 function getToken(){
    if(document.cookie != null)
        return document.cookie.split(';')[0].split('=')[1];
 }
function getRefreshToken(){
    if(document.cookie != null)
        return document.cookie.split(';')[1].split('=')[1];
}
 function start(){
    console.log(document.cookie)
     loadSidebarPlaylists();
     featured_playlists();
     loadTrending('toplists','toplists');
     loadTrending('Pop','0JQ5DAqbMKFEC4WFtoNRpw');
 }
