import BaseService from "../base";

export default class SearchService extends BaseService {
    async search(query: string) {
        const results = await Promise.all([
            this.services.search_duckduckgo.search(query),
            this.services.search_google.search(query),
            this.services.search_yandex.search(query),
        ])
        return results.flat()
    }
}