import { z } from 'zod';

const sortOrderValues = ['Ascending', 'Descending'] as const;

const embyImage = {
    BACKDROP: 'Backdrop',
    BANNER: 'Banner',
    BOX: 'Box',
    CHAPTER: 'Chapter',
    DISC: 'Disc',
    LOGO: 'Logo',
    PRIMARY: 'Primary',
    THUMB: 'Thumb',
} as const;

const embyCollection = {
    MUSIC: 'music',
    PLAYLISTS: 'playlists',
} as const;

const error = z.object({
    errors: z.object({
        recursive: z.array(z.string()),
    }),
    status: z.number(),
    title: z.string(),
    traceId: z.string(),
    type: z.string(),
});

const baseParameters = z.object({
    ArtistIds: z.string().optional(),
    EnableImageTypes: z.string().optional(),
    EnableTotalRecordCount: z.boolean().optional(),
    EnableUserData: z.boolean().optional(),
    Fields: z.string().optional(),
    GenreIds: z.string().optional(),
    ImageTypeLimit: z.number().optional(),
    IncludeItemTypes: z.string().optional(),
    IsFavorite: z.boolean().optional(),
    Limit: z.number().optional(),
    ParentId: z.string().optional(),
    Recursive: z.boolean().optional(),
    SearchTerm: z.string().optional(),
    SortBy: z.string().optional(),
    SortOrder: z.enum(sortOrderValues).optional(),
    StartIndex: z.number().optional(),
    UserId: z.string().optional(),
});

const paginationParameters = z.object({
    Limit: z.number().optional(),
    SortOrder: z.enum(sortOrderValues).optional(),
    StartIndex: z.number().optional(),
});

const pagination = z.object({
    StartIndex: z.number(),
    TotalRecordCount: z.number(),
});

const imageTags = z.object({
    Backdrop: z.string().optional(),
    Logo: z.string().optional(),
    Primary: z.string().optional(),
    Thumb: z.string().optional(),
});

const userData = z.object({
    IsFavorite: z.boolean(),
    PlaybackPositionTicks: z.number().optional(),
    PlayCount: z.number().optional(),
    Played: z.boolean(),
    Rating: z.number().optional(),
});

const mediaStream = z.object({
    BitDepth: z.number().optional(),
    BitRate: z.number().optional(),
    Channels: z.number().optional(),
    Codec: z.string(),
    Index: z.number(),
    IsDefault: z.boolean(),
    SampleRate: z.number().optional(),
    Type: z.string(),
});

const mediaSource = z.object({
    Container: z.string().optional(),
    Id: z.string(),
    MediaStreams: z.array(mediaStream).optional(),
    Path: z.string(),
    Protocol: z.string(),
    RunTimeTicks: z.number().optional(),
    Size: z.number().optional(),
});

const sessionInfo = z.object({
    Id: z.string(),
    UserId: z.string(),
    UserName: z.string(),
});

const userConfiguration = z.object({
    AudioLanguagePreference: z.string().optional(),
    PlayDefaultAudioTrack: z.boolean().optional(),
});

const userPolicy = z.object({
    IsAdministrator: z.boolean(),
    IsHidden: z.boolean(),
});

const user = z.object({
    Configuration: userConfiguration,
    HasConfiguredPassword: z.boolean(),
    HasPassword: z.boolean(),
    Id: z.string(),
    LastActivityDate: z.string().optional(),
    LastLoginDate: z.string().optional(),
    Name: z.string(),
    Policy: userPolicy,
    PrimaryImageTag: z.string().optional(),
    ServerId: z.string(),
    ServerName: z.string().optional(),
});

const authenticateParameters = z.object({
    Pw: z.string(),
    Username: z.string(),
});

const authenticate = z.object({
    AccessToken: z.string(),
    ServerId: z.string(),
    SessionInfo: sessionInfo,
    User: user,
});

const genericItem = z.object({
    Id: z.string(),
    Name: z.string(),
});

const genre = z.object({
    Id: z.string(),
    ImageTags: imageTags.optional(),
    Name: z.string(),
    ServerId: z.string(),
    Type: z.string(),
});

const genreList = pagination.extend({
    Items: z.array(genre),
});

const genreListSort = {
    NAME: 'SortName',
} as const;

const genreListParameters = paginationParameters.merge(
    baseParameters.extend({
        SortBy: z.nativeEnum(genreListSort).optional(),
    }),
);

const musicFolder = z.object({
    CollectionType: z.string(),
    Id: z.string(),
    IsFolder: z.boolean(),
    Name: z.string(),
    ServerId: z.string(),
    Type: z.string(),
});

const musicFolderListParameters = z.object({
    UserId: z.string(),
});

const musicFolderList = z.object({
    Items: z.array(musicFolder),
});

const playlist = z.object({
    ChildCount: z.number().optional(),
    Id: z.string(),
    ImageTags: imageTags.optional(),
    Name: z.string(),
    RunTimeTicks: z.number().optional(),
    ServerId: z.string(),
    Type: z.string(),
    UserData: userData.optional(),
});

const playlistListSort = {
    NAME: 'SortName',
    RECENTLY_ADDED: 'DateCreated',
} as const;

const playlistListParameters = paginationParameters.merge(
    baseParameters.extend({
        IncludeItemTypes: z.literal('Playlist'),
        SortBy: z.nativeEnum(playlistListSort).optional(),
    }),
);

const playlistList = pagination.extend({
    Items: z.array(playlist),
});

const artistItem = z.object({
    Id: z.string(),
    Name: z.string(),
});

const song = z.object({
    Album: z.string().optional(),
    AlbumArtist: z.string().optional(),
    AlbumArtists: z.array(artistItem).optional(),
    AlbumId: z.string().optional(),
    ArtistItems: z.array(artistItem).optional(),
    Artists: z.array(z.string()).optional(),
    DateCreated: z.string().optional(),
    DatePlayed: z.string().optional(),
    GenreItems: z.array(genericItem).optional(),
    Id: z.string(),
    ImageTags: imageTags.optional(),
    IndexNumber: z.number().optional(),
    MediaSources: z.array(mediaSource).optional(),
    Name: z.string(),
    ParentIndexNumber: z.number().optional(),
    PlaylistItemId: z.string().optional(),
    PremiereDate: z.string().optional(),
    ProductionYear: z.number().optional(),
    RunTimeTicks: z.number().optional(),
    ServerId: z.string(),
    Tags: z.array(z.string()).optional(),
    Type: z.string(),
    UserData: userData.optional(),
});

const albumArtist = z.object({
    AlbumCount: z.number().optional(),
    DateCreated: z.string().optional(),
    GenreItems: z.array(genericItem).optional(),
    Id: z.string(),
    ImageTags: imageTags.optional(),
    Name: z.string(),
    Overview: z.string().optional().nullable(),
    RunTimeTicks: z.number().optional(),
    ServerId: z.string(),
    SongCount: z.number().optional(),
    Type: z.string(),
    UserData: userData.optional(),
});

const album = z.object({
    AlbumArtists: z.array(artistItem),
    ArtistItems: z.array(artistItem),
    ChildCount: z.number().optional(),
    DateCreated: z.string().optional(),
    DateLastMediaAdded: z.string().optional(),
    DatePlayed: z.string().optional(),
    GenreItems: z.array(genericItem).optional(),
    Id: z.string(),
    ImageTags: imageTags.optional(),
    IsFolder: z.boolean(),
    Name: z.string(),
    PremiereDate: z.string().optional(),
    ProductionYear: z.number().optional(),
    RunTimeTicks: z.number().optional(),
    ServerId: z.string(),
    Songs: z.array(song).optional(), // Not a native Emby property
    Tags: z.array(z.string()).optional(),
    Type: z.string(),
    UserData: userData.optional(),
});

const albumListSort = {
    ALBUM_ARTIST: 'AlbumArtist,SortName',
    COMMUNITY_RATING: 'CommunityRating,SortName',
    CRITIC_RATING: 'CriticRating,SortName',
    NAME: 'SortName',
    PLAY_COUNT: 'PlayCount',
    RANDOM: 'Random',
    RECENTLY_ADDED: 'DateCreated,SortName',
    RECENTLY_PLAYED: 'DatePlayed,SortName',
    RELEASE_DATE: 'ProductionYear,PremiereDate,SortName',
} as const;

const albumListParameters = paginationParameters.merge(
    baseParameters.extend({
        Filters: z.string().optional(),
        IncludeItemTypes: z.literal('MusicAlbum'),
        SortBy: z.nativeEnum(albumListSort).optional(),
    }),
);

const albumList = pagination.extend({
    Items: z.array(album),
});

const albumArtistListSort = {
    NAME: 'SortName',
    RANDOM: 'Random',
    RECENTLY_ADDED: 'DateCreated',
} as const;

const albumArtistListParameters = paginationParameters.merge(
    baseParameters.extend({
        SortBy: z.nativeEnum(albumArtistListSort).optional(),
    }),
);

const albumArtistList = pagination.extend({
    Items: z.array(albumArtist),
});

const similarArtistListParameters = baseParameters.extend({
    Limit: z.number().optional(),
});

const songListSort = {
    ALBUM: 'Album,SortName',
    ALBUM_ARTIST: 'AlbumArtist,Album,SortName',
    ALBUM_DETAIL: 'ParentIndexNumber,IndexNumber',
    ARTIST: 'Artist,Album,SortName',
    COMMUNITY_RATING: 'CommunityRating,SortName',
    DURATION: 'Runtime',
    ID: 'SortName',
    LIST_ITEM_ORDER: 'ListItemOrder',
    NAME: 'SortName',
    PLAY_COUNT: 'PlayCount,SortName',
    RANDOM: 'Random',
    RECENTLY_ADDED: 'DateCreated,SortName',
    RECENTLY_PLAYED: 'DatePlayed,SortName',
    RELEASE_DATE: 'PremiereDate,AlbumArtist,Album,SortName',
    YEAR: 'ProductionYear,SortName',
} as const;

const songListParameters = paginationParameters.merge(
    baseParameters.extend({
        Filters: z.string().optional(),
        SortBy: z.nativeEnum(songListSort).optional(),
    }),
);

const songList = pagination.extend({
    Items: z.array(song),
});

const playlistSongList = songList;

const createPlaylistParameters = z.object({
    Ids: z.string().optional(),
    MediaType: z.literal('Audio').optional(),
    Name: z.string(),
    UserId: z.string().optional(),
});

const createPlaylist = z.object({
    Id: z.string(),
    ItemAddedCount: z.number().optional(),
    Name: z.string(),
});

const updatePlaylist = z.null();

const updatePlaylistParameters = z.object({
    Id: z.string(),
    Name: z.string(),
});

const addToPlaylist = z.null();

const addToPlaylistParameters = z.object({
    Ids: z.string(),
    UserId: z.string(),
});

const removeFromPlaylist = z.null();

const removeFromPlaylistParameters = z.object({
    EntryIds: z.string(),
});

const movePlaylistItem = z.null();

const movePlaylistItemParameters = z.object({
    itemId: z.string(),
    newIndex: z.number(),
    playlistId: z.string(),
});

const deletePlaylist = z.null();

const scrobblePlayingParameters = z.object({
    CanSeek: z.boolean().optional(),
    ItemId: z.string(),
    PlayMethod: z.enum(['Transcode', 'DirectPlay', 'DirectStream']).optional(),
    PlaySessionId: z.string(),
});

const scrobbleProgressParameters = z.object({
    EventName: z.string().optional(),
    IsPaused: z.boolean().optional(),
    ItemId: z.string(),
    PlaySessionId: z.string(),
    PositionTicks: z.number(),
});

const scrobbleMarkPlayedParameters = z.object({
    datePlayed: z.string().optional(),
});

const scrobbleStoppedParameters = z.object({
    ItemId: z.string(),
    PlaySessionId: z.string(),
    PositionTicks: z.number().optional(),
});

const scrobble = z.any();

const favorite = z.object({
    IsFavorite: z.boolean(),
    ItemId: z.string(),
    Key: z.string(),
});

const favoriteParameters = z.object({});

const searchParameters = paginationParameters.merge(baseParameters);

const search = z.any();

const lyricEvent = z.object({
    EndPositionTicks: z.number().optional(),
    StartPositionTicks: z.number(),
    Text: z.string(),
});

const lyrics = z.object({
    TrackEvents: z.array(lyricEvent),
});

const serverInfo = z.object({
    Id: z.string(),
    ServerName: z.string(),
    Version: z.string(),
});

const similarSongsParameters = z.object({
    Fields: z.string().optional(),
    Limit: z.number().optional(),
    UserId: z.string().optional(),
});

const similarSongs = pagination.extend({
    Items: z.array(song),
});

const filterListParameters = z.object({
    IncludeItemTypes: z.string().optional(),
    ParentId: z.string().optional(),
    UserId: z.string().optional(),
});

const filters = z.object({
    Genres: z.string().array().optional(),
    Tags: z.string().array().optional(),
    Years: z.number().array().optional(),
});

const setRatingParameters = z.object({
    rating: z.number(),
});

const setRating = z.null();

const deleteRatingParameters = z.object({});

const deleteRating = z.null();

const songDetailParameters = baseParameters.extend({
    Fields: z.string().optional(),
});

// Tag-related types
const tag = z.object({
    Id: z.string(),
    Name: z.string(),
});

const tagList = z.object({
    Items: z.array(tag),
    TotalRecordCount: z.number(),
});

const tagListParameters = z.object({
    Limit: z.number().optional(),
    StartIndex: z.number().optional(),
});

const addTagsParameters = z.object({
    Tags: z.array(z.string()),
});

const addTags = z.null();

const removeTagsParameters = z.object({
    Tags: z.array(z.string()),
});

const removeTags = z.null();

export const embyType = {
    _enum: {
        albumArtistList: albumArtistListSort,
        albumList: albumListSort,
        collection: embyCollection,
        genreList: genreListSort,
        image: embyImage,
        playlistList: playlistListSort,
        songList: songListSort,
    },
    _parameters: {
        addTags: addTagsParameters,
        addToPlaylist: addToPlaylistParameters,
        albumArtistDetail: baseParameters,
        albumArtistList: albumArtistListParameters,
        albumDetail: baseParameters,
        albumList: albumListParameters,
        authenticate: authenticateParameters,
        createPlaylist: createPlaylistParameters,
        deletePlaylist: z.object({}),
        deleteRating: deleteRatingParameters,
        favorite: favoriteParameters,
        filterList: filterListParameters,
        genreList: genreListParameters,
        movePlaylistItem: movePlaylistItemParameters,
        musicFolderList: musicFolderListParameters,
        playlistDetail: baseParameters,
        playlistList: playlistListParameters,
        removeFromPlaylist: removeFromPlaylistParameters,
        removeTags: removeTagsParameters,
        scrobbleMarkPlayed: scrobbleMarkPlayedParameters,
        scrobblePlaying: scrobblePlayingParameters,
        scrobbleProgress: scrobbleProgressParameters,
        scrobbleStopped: scrobbleStoppedParameters,
        search: searchParameters,
        setRating: setRatingParameters,
        similarArtistList: similarArtistListParameters,
        similarSongs: similarSongsParameters,
        songDetail: songDetailParameters,
        songList: songListParameters,
        tagList: tagListParameters,
        updatePlaylist: updatePlaylistParameters,
    },
    _response: {
        addTags,
        addToPlaylist,
        album,
        albumArtist,
        albumArtistList,
        albumList,
        authenticate,
        createPlaylist,
        deletePlaylist,
        deleteRating,
        error,
        favorite,
        filters,
        genre,
        genreList,
        lyrics,
        movePlaylistItem,
        musicFolderList,
        playlist,
        playlistList,
        playlistSongList,
        removeFromPlaylist,
        removeTags,
        scrobble,
        search,
        serverInfo,
        setRating,
        similarSongs,
        song,
        songList,
        tag,
        tagList,
        updatePlaylist,
        user,
    },
};
