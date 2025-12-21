export namespace app {
	
	export class FFmpegStatus {
	    available: boolean;
	    path: string;
	    version: string;
	    bundled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FFmpegStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.path = source["path"];
	        this.version = source["version"];
	        this.bundled = source["bundled"];
	    }
	}
	export class ImportResult {
	    added: number;
	    skipped: number;
	    invalid: number;
	    errors?: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.added = source["added"];
	        this.skipped = source["skipped"];
	        this.invalid = source["invalid"];
	        this.errors = source["errors"];
	    }
	}
	export class YouTubeSearchResult {
	    id: string;
	    title: string;
	    author: string;
	    duration: string;
	    durationSec: number;
	    thumbnail: string;
	    viewCount: string;
	    publishedAt: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new YouTubeSearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.duration = source["duration"];
	        this.durationSec = source["durationSec"];
	        this.thumbnail = source["thumbnail"];
	        this.viewCount = source["viewCount"];
	        this.publishedAt = source["publishedAt"];
	        this.url = source["url"];
	    }
	}
	export class YouTubeSearchResponse {
	    results: YouTubeSearchResult[];
	    query: string;
	
	    static createFrom(source: any = {}) {
	        return new YouTubeSearchResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.results = this.convertValues(source["results"], YouTubeSearchResult);
	        this.query = source["query"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace core {
	
	export class AudioStream {
	    codec: string;
	    channels: number;
	    sampleRate: number;
	    bitrate: number;
	
	    static createFrom(source: any = {}) {
	        return new AudioStream(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.codec = source["codec"];
	        this.channels = source["channels"];
	        this.sampleRate = source["sampleRate"];
	        this.bitrate = source["bitrate"];
	    }
	}
	export class VideoStream {
	    codec: string;
	    width: number;
	    height: number;
	    fps: number;
	    bitrate: number;
	
	    static createFrom(source: any = {}) {
	        return new VideoStream(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.codec = source["codec"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.fps = source["fps"];
	        this.bitrate = source["bitrate"];
	    }
	}
	export class MediaInfo {
	    duration: number;
	    format: string;
	    size: number;
	    bitrate: number;
	    videoStream?: VideoStream;
	    audioStream?: AudioStream;
	
	    static createFrom(source: any = {}) {
	        return new MediaInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.duration = source["duration"];
	        this.format = source["format"];
	        this.size = source["size"];
	        this.bitrate = source["bitrate"];
	        this.videoStream = this.convertValues(source["videoStream"], VideoStream);
	        this.audioStream = this.convertValues(source["audioStream"], AudioStream);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ConversionJob {
	    id: string;
	    inputPath: string;
	    outputPath: string;
	    presetId?: string;
	    customArgs?: string[];
	    state: string;
	    progress: number;
	    duration?: number;
	    currentTime?: number;
	    error?: string;
	    inputInfo?: MediaInfo;
	
	    static createFrom(source: any = {}) {
	        return new ConversionJob(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.inputPath = source["inputPath"];
	        this.outputPath = source["outputPath"];
	        this.presetId = source["presetId"];
	        this.customArgs = source["customArgs"];
	        this.state = source["state"];
	        this.progress = source["progress"];
	        this.duration = source["duration"];
	        this.currentTime = source["currentTime"];
	        this.error = source["error"];
	        this.inputInfo = this.convertValues(source["inputInfo"], MediaInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ConversionPreset {
	    id: string;
	    name: string;
	    description: string;
	    category: string;
	    outputExt: string;
	    ffmpegArgs?: string[];
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new ConversionPreset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.outputExt = source["outputExt"];
	        this.ffmpegArgs = source["ffmpegArgs"];
	        this.options = source["options"];
	    }
	}
	
	export class VideoMetadata {
	    id: string;
	    title: string;
	    author: string;
	    duration: number;
	    thumbnail: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.duration = source["duration"];
	        this.thumbnail = source["thumbnail"];
	        this.description = source["description"];
	    }
	}
	export class QueueItem {
	    id: string;
	    url: string;
	    state: string;
	    format: string;
	    metadata?: VideoMetadata;
	    savePath: string;
	    filePath?: string;
	    error?: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new QueueItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.url = source["url"];
	        this.state = source["state"];
	        this.format = source["format"];
	        this.metadata = this.convertValues(source["metadata"], VideoMetadata);
	        this.savePath = source["savePath"];
	        this.filePath = source["filePath"];
	        this.error = source["error"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Settings {
	    version: number;
	    defaultSavePath: string;
	    defaultFormat: string;
	    defaultAudioQuality: string;
	    defaultVideoQuality: string;
	    maxConcurrentDownloads: number;
	    ffmpegPath?: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.defaultSavePath = source["defaultSavePath"];
	        this.defaultFormat = source["defaultFormat"];
	        this.defaultAudioQuality = source["defaultAudioQuality"];
	        this.defaultVideoQuality = source["defaultVideoQuality"];
	        this.maxConcurrentDownloads = source["maxConcurrentDownloads"];
	        this.ffmpegPath = source["ffmpegPath"];
	    }
	}
	

}

export namespace frontend {
	
	export class FileFilter {
	    DisplayName: string;
	    Pattern: string;
	
	    static createFrom(source: any = {}) {
	        return new FileFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DisplayName = source["DisplayName"];
	        this.Pattern = source["Pattern"];
	    }
	}

}

