export namespace core {
	
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

