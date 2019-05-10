#ifndef FFMPEG_H
#define FFMPEG_H
/**
 * THIS FILE REDEFINES DATA AS RETURNED BY THE FFMPEG LIBRARY.
 * HEADER FILES ARE NOT DISTRIBUTED IN OUR SETUP, HENCE THIS.
 */

/**
 * https://ffmpeg.org/doxygen/trunk/avutil_8h_source.html#l00199
 */
enum AVMediaType
{
    _UNKNOWN_DATA_AVMediaType = -1,
};

/**
 * https://ffmpeg.org/doxygen/trunk/avcodec_8h_source.html#l00215
 */
enum AVCodecID
{
    __UNKNOWN_DATA_AVCodecID = 0,
};

/**
 * https://ffmpeg.org/doxygen/trunk/avcodec_8h_source.html#l03476
 */
struct AVCodec
{
    const char *name, *long_name;
    enum AVMediaType type;
    enum AVCodecID id;
};

/**
 * https://www.ffmpeg.org/doxygen/3.4/avcodec_8h_source.html#l00703
 */
struct AVCodecDescriptor
{
    enum AVCodecID id;
    enum AVMediaType type;
    const char *name, *long_name;
};

/**
 * Wrapper around the ffmpeg library that must be loaded at runtime.
 */
struct FFMPEG_Library
{
    void *handle;

    /**
     * https://ffmpeg.org/doxygen/3.2/allformats_8c_source.html#l00044
     */
    void (*av_register_all)(void);

    /**
     * https://ffmpeg.org/doxygen/trunk/allcodecs_8c_source.html#l00837
     *
     * We use AVCodecDescriptor because it is the only structure that we can
     * query on all platforms. Windows' ffmpeg.dll does not export a
     * `av_codec_next` function, only `avcodec_descriptor_next`.
     * Also it seems that this "descriptor" concept is the recommended API.
     */
    struct AVCodecDescriptor *(*avcodec_descriptor_next)(const struct AVCodecDescriptor *);

    /**
     * https://www.ffmpeg.org/doxygen/3.4/libavcodec_2utils_8c_source.html#l01275
     */
    struct AVCodec *(*avcodec_find_decoder)(enum AVCodecID);
};

#define NULL_FFMPEG_LIBRARY \
    (struct FFMPEG_Library) { NULL, NULL, NULL, NULL }

/**
 * Loader that will inject the loaded functions into a FFMPEG_Library structure.
 */
char *load_ffmpeg_library(struct FFMPEG_Library *library, char *library_path);

/**
 * Free library.
 */
char *unload_ffmpeg_library(struct FFMPEG_Library *library);

#endif // FFMPEG_H guard
