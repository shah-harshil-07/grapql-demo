import { gql } from "@apollo/client";

export const GET_POSTS = gql`
    query Posts($options: PageQueryOptions) {
        posts(options: $options) {
            data {
                id
                body
                title
            }
        }
    }
`;